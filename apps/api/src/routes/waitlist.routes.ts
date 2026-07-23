import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { db } from "../config/firebase.config";
import { validateRequest } from "../middleware/validate.middleware";
import { joinWaitlistSchema, JoinWaitlistDTO } from "@checkmate/shared-types";
import { emailService } from "../services/email/email.service";
import { renderEmailTemplate } from "../utils/templateLoader";
import { logger } from "../utils/logger";
import { success, error } from "../utils/response";
import * as admin from "firebase-admin";

const router = Router();

// Rate limiter for join endpoint (max 5 requests per IP per hour)
const joinLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many signups from this IP, please try again after an hour",
    data: null,
  },
});

router.post("/join", joinLimiter, validateRequest(joinWaitlistSchema), async (req: Request, res: Response) => {
  const data: JoinWaitlistDTO = req.body;
  const email = data.email.toLowerCase().trim();

  try {
    const result = await db.runTransaction(async (transaction) => {
      // Check if user already exists
      const existingQuery = await transaction.get(
        db.collection("waitlist").where("email", "==", email).limit(1)
      );

      if (!existingQuery.empty) {
        return { exists: true };
      }

      // Calculate position
      // Using an aggregation query for count (much cheaper than pulling all docs)
      const countQuery = await transaction.get(db.collection("waitlist").count());
      const position = countQuery.data().count + 1;

      // Handle referral
      if (data.referredBy) {
        const refEmail = data.referredBy.toLowerCase().trim();
        const referrerQuery = await transaction.get(
          db.collection("waitlist").where("email", "==", refEmail).limit(1)
        );
        if (!referrerQuery.empty) {
          const referrerDocRef = referrerQuery.docs[0].ref;
          transaction.update(referrerDocRef, {
            referralCount: admin.firestore.FieldValue.increment(1),
          });
        }
      }

      // Create new document
      const newDocRef = db.collection("waitlist").doc();
      transaction.set(newDocRef, {
        id: newDocRef.id,
        fullName: data.fullName,
        email,
        phone: data.phone,
        countryCode: data.countryCode,
        country: data.country,
        chessLevel: data.chessLevel,
        position,
        status: "waiting",
        referredBy: data.referredBy ? data.referredBy.toLowerCase().trim() : null,
        referralCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        activatedAt: null,
        emailSent: false,
      });

      return {
        isNew: true,
        docId: newDocRef.id,
        position,
        email,
        status: "waiting",
        fullName: data.fullName,
      };
    });

    if (result.exists) {
      return res.status(409).json(error("This email is already registered on the waitlist."));
    }

    if (result.isNew) {
      const firstName = result.fullName ? result.fullName.split(' ')[0] : 'Player';
      // Fire and forget — don't block the HTTP response
      emailService.send({
        to: result.email,
        toName: result.fullName!,
        subject: "You're in the queue — CheckMate Beta #" + result.position,
        htmlBody: renderEmailTemplate('waitlistConfirmation.html', { firstName, position: result.position }),
      }).then(sendResult => {
        // Update emailSent field in Firestore based on result.success
        db.collection('waitlist').doc(result.docId!).update({ 
          emailSent: sendResult.success 
        });
      }).catch(err => {
        logger.error('Email send failed', { email: result.email, error: err });
      });
    }

    return res.status(200).json(
      success({
        position: result.position,
        email: result.email,
        status: result.status,
      })
    );
  } catch (err) {
    console.error("Error joining waitlist:", err);
    return res.status(500).json(error("Internal server error during waitlist join"));
  }
});

router.get("/status", async (req: Request, res: Response) => {
  const email = req.query.email?.toString().toLowerCase().trim();
  if (!email) {
    return res.status(400).json(error("Email query parameter is required"));
  }

  try {
    const userQuery = await db.collection("waitlist").where("email", "==", email).limit(1).get();
    
    if (userQuery.empty) {
      return res.status(404).json(error("Email not found on waitlist"));
    }

    const userData = userQuery.docs[0].data();
    
    // Count people ahead
    const aheadQuery = await db.collection("waitlist")
      .where("status", "==", "waiting")
      .where("position", "<", userData.position)
      .count()
      .get();
      
    const peopleAhead = aheadQuery.data().count;

    return res.status(200).json(
      success({
        position: userData.position,
        status: userData.status,
        peopleAhead,
        estimatedActivation: "this week",
      })
    );
  } catch (err) {
    console.error("Error checking status:", err);
    return res.status(500).json(error("Internal server error checking status"));
  }
});

let cache = {
  totalSignups: 0,
  timestamp: 0
};
const CACHE_TTL = 30000; // 30 seconds

router.get("/count", async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    if (now - cache.timestamp > CACHE_TTL) {
      const countQuery = await db.collection("waitlist").count().get();
      cache.totalSignups = countQuery.data().count;
      cache.timestamp = now;
    }

    const maxSpots = 1000;
    const spotsRemaining = Math.max(0, maxSpots - cache.totalSignups);

    return res.status(200).json(
      success({
        totalSignups: cache.totalSignups,
        spotsRemaining,
        maxSpots,
      })
    );
  } catch (err) {
    console.error("Error getting waitlist count:", err);
    return res.status(500).json(error("Internal server error"));
  }
});

export default router;
