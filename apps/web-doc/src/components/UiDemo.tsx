import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Card, CardHeader, CardTitle, CardDescription, CardContent} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Switch} from '@/components/ui/switch';
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs';
import {Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import {Tooltip, TooltipTrigger, TooltipContent} from '@/components/ui/tooltip';
import {toast} from '@/components/ui/toast';

export default function UiDemo() {
  const [enabled, setEnabled] = useState(true);

  return (
    <Card className="my-6 max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>RiskAtlas arayüz bileşenleri</CardTitle>
          <Badge variant="secondary">shadcn/ui</Badge>
        </div>
        <CardDescription>Tailwind CSS ile düzenlenmiş etkileşimli örnek.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="settings">
          <TabsList>
            <TabsTrigger value="settings">Ayarlar</TabsTrigger>
            <TabsTrigger value="actions">İşlemler</TabsTrigger>
          </TabsList>
          <TabsContent value="settings" className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="ui-demo-name">Görünüm adı</Label>
              <Input id="ui-demo-name" placeholder="Örnek görünüm" />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="ui-demo-enabled" checked={enabled} onCheckedChange={setEnabled} />
              <Label htmlFor="ui-demo-enabled">Bildirimler {enabled ? 'açık' : 'kapalı'}</Label>
            </div>
            <Button onClick={() => toast.add({title: 'Ayarlar kaydedildi', type: 'success'})}>
              Kaydet
            </Button>
          </TabsContent>
          <TabsContent value="actions" className="flex flex-wrap gap-3 pt-4">
            <Dialog>
              <DialogTrigger render={<Button variant="outline" />}>Pencere aç</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>shadcn/ui hazır</DialogTitle>
                  <DialogDescription>Bileşenleri Markdown ve React sayfalarında kullanabilirsiniz.</DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            <Tooltip>
              <TooltipTrigger render={<Button variant="secondary" />}>Bilgi</TooltipTrigger>
              <TooltipContent>Docusaurus temasına uyumlu araç ipucu.</TooltipContent>
            </Tooltip>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
