import fs from 'fs';
import path from 'path';

export function renderEmailTemplate(
  templateName: string,
  variables: Record<string, string | number>
): string {
  const fileName = templateName.endsWith('.html') ? templateName : `${templateName}.html`;
  const templatePath = path.join(__dirname, '../templates', fileName);

  let html = fs.readFileSync(templatePath, 'utf-8');

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    html = html.replace(regex, String(value));
  }

  return html;
}
