import fs from 'fs';
import path from 'path';

export function waitlistConfirmationTemplate(fullName: string, position: number): string {
  const firstName = fullName.split(' ')[0] || 'Player';
  
  const templatePath = path.join(__dirname, 'waitlistConfirmation.html');
  let html = fs.readFileSync(templatePath, 'utf-8');
  
  html = html.replace(/\{\{firstName\}\}/g, firstName);
  html = html.replace(/\{\{position\}\}/g, position.toString());
  
  return html;
}
