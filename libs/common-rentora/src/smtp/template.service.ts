import { readFileSync, existsSync } from 'fs';
import { Injectable } from '@nestjs/common';
import * as handlebars from 'handlebars';
import { join, resolve } from 'path';

@Injectable()
export class TemplateService {
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();

  private readonly templatesPath = resolve(
    process.cwd(),
    'libs/common-rentora/src/smtp/templates',
  );

  compile(
    template: string,
    context: Record<string, unknown> = {},
  ): { html: string; error: string | null } {
    try {
      if (!this.templates.has(template)) {
        const templatePath = join(this.templatesPath, `${template}.hbs`);

        if (!existsSync(templatePath)) {
          return {
            html: '',
            error: `template "${template}" not found on path: ${templatePath}`,
          };
        }

        const templateContent = readFileSync(templatePath, 'utf-8');

        this.templates.set(template, handlebars.compile(templateContent));
      }

      const compiled = this.templates.get(template);

      if (!compiled) {
        return {
          html: '',
          error: `Failed to get compiled template "${template}"`,
        };
      }

      const html = compiled(context);

      return {
        html,
        error: null,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      return {
        html: '',
        error: `Template rendering error "${template}": ${message}`,
      };
    }
  }
}
