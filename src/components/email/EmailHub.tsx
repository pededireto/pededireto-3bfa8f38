import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Send, Megaphone, Zap, BarChart3, Inbox } from "lucide-react";
import EmailTemplatesContent from "@/components/email/EmailTemplatesContent";
import EmailSendContent from "@/components/email/EmailSendContent";
import EmailCampaignsContent from "@/components/email/EmailCampaignsContent";
import EmailCadencesContent from "@/components/email/EmailCadencesContent";
import EmailAnalyticsContent from "@/components/email/EmailAnalyticsContent";
import EmailInboxContent from "@/components/email/EmailInboxContent";

interface EmailHubProps {
  showInbox?: boolean;
  defaultTab?: string;
}

const EmailHub = ({ showInbox = false, defaultTab = "templates" }: EmailHubProps) => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="templates" className="gap-1.5"><FileText className="w-3.5 h-3.5" />Templates</TabsTrigger>
          <TabsTrigger value="send" className="gap-1.5"><Send className="w-3.5 h-3.5" />Enviar</TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5"><Megaphone className="w-3.5 h-3.5" />Campanhas</TabsTrigger>
          <TabsTrigger value="cadences" className="gap-1.5"><Zap className="w-3.5 h-3.5" />Cadences</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" />Analytics</TabsTrigger>
          {showInbox && <TabsTrigger value="inbox" className="gap-1.5"><Inbox className="w-3.5 h-3.5" />Inbox</TabsTrigger>}
        </TabsList>

        <TabsContent value="templates"><EmailTemplatesContent /></TabsContent>
        <TabsContent value="send"><EmailSendContent /></TabsContent>
        <TabsContent value="campaigns"><EmailCampaignsContent /></TabsContent>
        <TabsContent value="cadences"><EmailCadencesContent /></TabsContent>
        <TabsContent value="analytics"><EmailAnalyticsContent /></TabsContent>
        {showInbox && <TabsContent value="inbox"><EmailInboxContent /></TabsContent>}
      </Tabs>
    </div>
  );
};

export default EmailHub;
