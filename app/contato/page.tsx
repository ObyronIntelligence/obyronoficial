"use client";

import { Mail, MapPin, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContatoPage() {
  const [sent, setSent] = useState(false);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
  };

  return (
    <section className="container mx-auto px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <Badge variant="outline" className="mb-4 border-border/60 bg-card/40 backdrop-blur">
          Fale conosco
        </Badge>
        <h1 className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-6xl">
          Vamos conversar
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Conte sobre seu projeto. Respondemos em ate 1 dia util.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
        {[
          { icon: Mail, title: "E-mail", value: "contato@obyron.com" },
          { icon: MessageCircle, title: "WhatsApp", value: "+55 (11) 90000-0000" },
          { icon: MapPin, title: "Localizacao", value: "Sao Paulo, BR · Remoto" },
        ].map((item) => (
          <Card key={item.title} className="border-border/60 bg-card/40 backdrop-blur">
            <CardContent className="flex items-start gap-3 p-6">
              <item.icon className="h-5 w-5 text-brand" />
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mx-auto mt-8 max-w-3xl border-border/60 bg-card/40 backdrop-blur">
        <CardContent className="p-8">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" required placeholder="Seu nome" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" required placeholder="voce@empresa.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" placeholder="Sua empresa" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea id="message" required rows={5} placeholder="Conte sobre seu projeto..." />
            </div>
            <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90">
              Enviar mensagem
            </Button>
            {sent && (
              <p className="text-center text-sm text-brand">
                Mensagem enviada. Em breve nosso time entra em contato.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
