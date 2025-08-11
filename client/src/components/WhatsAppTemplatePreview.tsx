import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Smartphone } from 'lucide-react';

interface WhatsAppTemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  buttons?: Array<{
    type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY';
    text: string;
    url?: string;
    phone_number?: string;
  }>;
  example?: {
    body_text?: string[][];
    header_text?: string[];
  };
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  status: string;
  components?: WhatsAppTemplateComponent[];
  metaTemplate?: any;
}

interface WhatsAppTemplatePreviewProps {
  template: WhatsAppTemplate;
}

export function WhatsAppTemplatePreview({ template }: WhatsAppTemplatePreviewProps) {
  // Use metaTemplate if available (complete structure), otherwise fall back to components
  const components = template.metaTemplate?.components || template.components || [];
  
  const renderComponent = (component: WhatsAppTemplateComponent, index: number) => {
    switch (component.type) {
      case 'HEADER':
        return (
          <div key={index} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-t-2xl">
            <div className="font-semibold text-gray-900 dark:text-white text-sm">
              {component.text || 'Header'}
            </div>
          </div>
        );
      
      case 'BODY':
        // Replace {{variables}} with sample text for preview
        let bodyText = component.text || '';
        bodyText = bodyText.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
          // Common variable replacements for preview
          const replacements: Record<string, string> = {
            'name': '{name}',
            'first_name': '{name}',
            'company': '{company}',
            'date': '{date}',
            'time': '{time}',
            'amount': '{amount}',
            'link': '{link}'
          };
          return replacements[variable.toLowerCase()] || `{${variable}}`;
        });
        
        return (
          <div key={index} className="bg-white dark:bg-gray-700 p-4">
            <div className="text-gray-900 dark:text-white text-sm whitespace-pre-wrap leading-relaxed">
              {bodyText}
            </div>
          </div>
        );
      
      case 'FOOTER':
        return (
          <div key={index} className="bg-white dark:bg-gray-700 px-4 pb-3">
            <div className="text-gray-500 dark:text-gray-400 text-xs">
              {component.text}
            </div>
          </div>
        );
      
      case 'BUTTONS':
        return (
          <div key={index} className="bg-white dark:bg-gray-700 p-3 rounded-b-2xl border-t border-gray-200 dark:border-gray-600">
            <div className="space-y-2">
              {component.buttons?.map((button, buttonIndex) => (
                <Button 
                  key={buttonIndex}
                  variant="outline" 
                  size="sm" 
                  className="w-full h-8 text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950"
                >
                  {button.type === 'URL' && <ExternalLink className="w-3 h-3 mr-1" />}
                  {button.type === 'PHONE_NUMBER' && <Smartphone className="w-3 h-3 mr-1" />}
                  {button.text}
                </Button>
              )) || <div className="text-xs text-gray-500 dark:text-gray-400">No buttons defined</div>}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      {/* Template Info Header */}
      <div className="mb-3">
        <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">
          WhatsApp Template Preview
        </h4>
        <div className="flex gap-2 flex-wrap">
          <Badge variant={template.status === 'APPROVED' ? 'default' : 'secondary'} className="text-xs">
            {template.status}
          </Badge>
          <Badge variant="outline" className="text-xs">{template.category}</Badge>
          <Badge variant="outline" className="text-xs">{template.language}</Badge>
        </div>
      </div>

      {/* WhatsApp Message Bubble */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-3xl border border-green-200 dark:border-green-800">
        <div className="bg-white dark:bg-gray-700 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-600 max-w-xs">
          {components.length > 0 ? (
            components.map((component: any, index: number) => renderComponent(component, index))
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              No template components available
            </div>
          )}
          
          {/* WhatsApp timestamp */}
          <div className="bg-white dark:bg-gray-700 px-4 pb-2 rounded-b-2xl">
            <div className="text-right">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                08:04 ✓✓
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Template Details */}
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        <div>Template: <span className="font-mono">{template.name}</span></div>
        <div>Components: {components.length} (HEADER, BODY, FOOTER, BUTTONS)</div>
      </div>
    </div>
  );
}