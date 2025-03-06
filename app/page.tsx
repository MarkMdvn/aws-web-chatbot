"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  MessageCircle,
  Send,
  Loader2,
  ArrowDownCircleIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import LandingSections from "@/components/LandingSections";
import Image from "next/image";

export default function Chat() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showChatIcon, setShowChatIcon] = useState(false);
  const chatIconRef = useRef<HTMLButtonElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    reload,
    error,
  } = useChat({
    api: "/api/aws-bedrock",
    streamProtocol: "text",
    transformResponse: (res) => {
      console.log("transformResponse raw:", res);
     
      const content =
        typeof res === "object" && res !== null && "text" in res
          ? res.text
          : String(res);
      return {
        id: Date.now().toString(),
        role: "assistant",
        content,
        createdAt: new Date().toISOString(),
      };
    },
    onFinish: (message, options) => {
      console.log("onFinish:", message, options);
    },
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowChatIcon(true);
      } else {
        setShowChatIcon(false);
        setIsChatOpen(false);
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col min-h-screen">
      <LandingSections />
      <AnimatePresence>
        {showChatIcon && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-3 right-3 z-50"
          >
            <Button
              ref={chatIconRef}
              onClick={toggleChat}
              size="icon"
              className="rounded-full size-14 p-2 shadow-lg"
            >
              {!isChatOpen ? (
                <MessageCircle className="size-10" />
              ) : (
                <ArrowDownCircleIcon />
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 z-50 w-[95%] md:w-[500px]"
          >
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center">
                  <Image
                    src="/logo-epoint-white.png"
                    alt="Logo epoint"
                    width={110}
                    height={32}
                    className="mr-2"
                  />
                  <CardTitle className="text-lg font-bold"></CardTitle>
                </div>
                <Button
                  onClick={toggleChat}
                  variant="ghost"
                  size="sm"
                  className="px-2 py-0"
                >
                  <X className="size-4" />
                  <span className="sr-only">Cerrar Chat</span>
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  {messages?.length === 0 && (
                    <div className="w-full mt-32 text-gray-500 flex items-center justify-center gap-3">
                      Comienza una conversación
                    </div>
                  )}
                  {messages?.map((message, index) => (
                    <div
                      key={index}
                      className={`mb-4 ${
                        message.role === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      <div
                        className={`inline-block rounded-2xl p-2 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground "
                            : "bg-muted "
                        }`}
                      >
                        <ReactMarkdown
                          children={message.content}
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({
                              node,
                              inline,
                              className,
                              children,
                              ...props
                            }) {
                              return inline ? (
                                <code
                                  {...props}
                                  className="bg-gray-200 px-1 rounded"
                                >
                                  {children}
                                </code>
                              ) : (
                                <pre
                                  {...props}
                                  className="bg-gray-200 p-2 rounded"
                                >
                                  {children}
                                </pre>
                              );
                            },
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="w-full flex items-center justify-center gap-3">
                      <Loader2 className="animate-spin h-5 w-5 text-primary" />
                      <button
                        className="underline"
                        type="button"
                        onClick={() => stop()}
                      >
                        {/* cancelar */}
                      </button>
                    </div>
                  )}
                  {error && (
                    <div className="w-full flex items-center justify-center gap-3">
                      <div>Ha sucedido un error</div>
                      <button
                        className="underline"
                        type="button"
                        onClick={() => reload()}
                      >
                        Reintentar
                      </button>
                    </div>
                  )}
                  <div ref={scrollRef}></div>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <form
                  onSubmit={handleSubmit}
                  className="flex w-full items-center space-x-2"
                >
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    className="flex-1"
                    placeholder="¿Qué te gustaría saber?"
                  />
                  <Button
                    type="submit"
                    className="size-9"
                    disabled={isLoading}
                    size="icon"
                  >
                    <Send className="size-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
