import fs from 'fs';
import path from 'path';

export function betaActivationTemplate(fullName: string, activationLink: string): string {
  const firstName = fullName.split(' ')[0] || 'Player';
  
  const templatePath = path.join(__dirname, 'betaActivation.html');
  let html = fs.readFileSync(templatePath, 'utf-8');
  
  html = html.replace(/\{\{firstName\}\}/g, firstName);
  html = html.replace(/\{\{activationLink\}\}/g, activationLink);
  
  return html;
}
