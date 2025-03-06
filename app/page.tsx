"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
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
  const [processedMessages, setProcessedMessages] = useState([]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    reload,
    error,
    setMessages,
  } = useChat({
    api: "/api/aws-bedrock",
    streamProtocol: "text",
  });

  // Add initial welcome message when component mounts
  useEffect(() => {
    if (messages.length === 0) {
      // Add the initial welcome message
      const welcomeMessage = {
        id: "welcome-message",
        role: "assistant",
        content:
          "¡Hola! Soy el asistente virtual de epoint.es ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre nuestros servicios de desarrollo web, marketing digital o consultoría tecnológica.",
        createdAt: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Process messages to extract text content from JSON responses
  useEffect(() => {
    if (!messages || messages.length === 0) {
      setProcessedMessages([]);
      return;
    }

    const processed = messages.map((message) => {
      if (message.role === "user") {
        return message;
      }

      // Process assistant messages to extract text from JSON if needed
      try {
        let content = message.content;

        // Check if the content is a JSON string
        if (
          typeof content === "string" &&
          content.trim().startsWith("{") &&
          content.includes('"text"')
        ) {
          const parsed = JSON.parse(content);
          if (parsed.text) {
            content = parsed.text;
          }
        }

        return {
          ...message,
          content,
        };
      } catch (error) {
        console.error("Error processing message:", error);
        return message;
      }
    });

    setProcessedMessages(processed);
  }, [messages]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
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
  }, [processedMessages]);

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
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 rounded-t-lg shadow-lg">
                <div className="flex items-center space-x-3">
                  <Image
                    src="/epoint-logo-dark-transparent.png"
                    alt="Logo epoint"
                    width={150}
                    height={50}
                    className="mr-2"
                  />
                </div>
                <Button
                  onClick={toggleChat}
                  variant="ghost"
                  size="sm"
                  className="px-2 py-0 text-white hover:bg-white/20 transition-colors"
                >
                  <X className="size-4" />
                  <span className="sr-only">Cerrar Chat</span>
                </Button>
              </CardHeader>

              <hr className="border-0 mb-2 h-[2px] bg-gradient-to-r from-pink-500 via-blue-500 to-violet-500" />
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  {processedMessages?.length === 0 ? (
                    <div className="w-full mt-32 text-gray-500 flex items-center justify-center gap-3">
                      Comienza una conversación
                    </div>
                  ) : (
                    processedMessages?.map((message, index) => (
                      <div
                        key={index}
                        className={`mb-4 ${
                          message.role === "user" ? "text-right" : "text-left"
                        }`}
                      >
                        <div
                          className={`flex ${
                            message.role === "user"
                              ? "justify-end"
                              : "justify-start items-start"
                          }`}
                        >
                          {message.role === "assistant" && (
                            <div className="mr-2 flex-shrink-0">
                              <div className="rounded-full w-6 h-6 flex items-center justify-center overflow-hidden shadow-[0_0_10px_rgba(255,105,180,0.5)]">
                                <Image
                                  src="/logo-epoint-blanco.png"
                                  alt="Assistant"
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                />
                              </div>
                            </div>
                          )}

                          <div
                            className={`inline-block rounded-2xl p-2  ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-[#fbcfe8]"
                            }`}
                          >
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkBreaks]}
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
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
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
