import { apiClient } from "./client";
import type { Wallet, Transaction, BankAccount } from "@checkmate/shared-types";

export const getBalance = () =>
  apiClient.get<{ wallet: Wallet }>("/v1/wallet/balance");

export const initiateDeposit = (data: {
  bundleId?: string;
  customCrowns?: number;
}) =>
  apiClient.post<{ paymentLink: string; txRef: string }>(
    "/v1/wallet/deposit",
    data,
  );

export const initiateWithdrawal = (data: {
  crowns: number;
  bankAccountId?: string;
}) =>
  apiClient.post<{
    reference: string;
    status: string;
    crownsDeducted: number;
    usdAmount: number;
  }>("/v1/wallet/withdraw", data);

export const getTransactions = (page: number = 1, limit: number = 20) =>
  apiClient.get<{
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
  }>(`/v1/wallet/transactions?page=${page}&limit=${limit}`);

export const saveBankAccount = (data: {
  bankCode: string;
  accountNumber: string;
}) =>
  apiClient.post<{ bankAccount: BankAccount }>("/v1/wallet/bank-account", data);

export const getBankAccount = () =>
  apiClient.get<{ bankAccount: BankAccount | null }>("/v1/wallet/bank-account");

export const resolveBankAccount = (bankCode: string, accountNumber: string) =>
  apiClient.post<{ accountName: string }>("/v1/wallet/resolve-account", {
    bankCode,
    accountNumber,
  });

export const getExchangeRate = (currency: string) =>
  apiClient.get<{ rate: number }>(`/v1/wallet/exchange-rate?currency=${currency}`);

export const getBanks = (country: string = 'NG') =>
  apiClient.get<{ banks: { code: string; name: string }[] }>(`/v1/wallet/banks?country=${country}`);
