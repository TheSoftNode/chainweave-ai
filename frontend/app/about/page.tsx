"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Zap, Shield, Globe, Users, Code, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import Link from "next/link"

const features = [
  {
    icon: Zap,
    title: "Cross-Chain AI",
    description: "Harness the power of AI across multiple blockchain networks through ZetaChain's universal architecture."
  },
  {
    icon: Shield,
    title: "Secure & Decentralized",
    description: "Built on ZetaChain's robust infrastructure ensuring security and true decentralization."
  },
  {
    icon: Globe,
    title: "Universal Compatibility",
    description: "Create and mint NFTs across Bitcoin, Ethereum, BSC, and other supported networks seamlessly."
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Join a vibrant community of creators, collectors, and blockchain enthusiasts."
  },
  {
    icon: Code,
    title: "Open Source",
    description: "Built with transparency in mind, contributing to the open-source blockchain ecosystem."
  },
  {
    icon: Sparkles,
    title: "AI-Powered Creation",
    description: "Advanced AI algorithms transform your ideas into unique, valuable digital assets."
  }
]

const stats = [
  { value: "10K+", label: "NFTs Created" },
  { value: "50+", label: "Supported Chains" },
  { value: "5K+", label: "Active Users" },
  { value: "99.9%", label: "Uptime" }
]

const team = [
  {
    name: "Sarah Chen",
    role: "Lead Blockchain Developer",
    description: "Expert in ZetaChain architecture and cross-chain protocols."
  },
  {
    name: "Marcus Rodriguez",
    role: "AI/ML Engineer",
    description: "Specializes in generative AI and machine learning for digital art."
  },
  {
    name: "Elena Petrov",
    role: "Product Designer",
    description: "Creates intuitive user experiences for blockchain applications."
  },
  {
    name: "David Kim",
    role: "Smart Contract Auditor",
    description: "Ensures security and efficiency of our smart contract infrastructure."
  }
]

export default function AboutPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge variant="secondary" className="mb-4">
              About ChainWeave AI
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Weaving AI with Blockchain
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              ChainWeave AI revolutionizes digital asset creation by combining cutting-edge artificial intelligence 
              with ZetaChain's universal blockchain infrastructure. We're building the future of cross-chain NFTs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-6">
                We believe that creativity should know no boundaries. ChainWeave AI breaks down the barriers 
                between different blockchain networks, allowing creators to mint, trade, and showcase their 
                AI-generated NFTs across the entire Web3 ecosystem.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                By leveraging ZetaChain's omnichain capabilities, we're creating a truly universal platform 
                where digital assets can flow freely across Bitcoin, Ethereum, BSC, and beyond.
              </p>
              <Link href="/dashboard">
                <Button size="lg" className="group">
                  Start Creating
                  <Sparkles className="ml-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <Card className="relative bg-card border">
                <CardHeader>
                  <CardTitle className="text-center">Platform Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    {stats.map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                        className="text-center"
                      >
                        <div className="text-2xl font-bold text-primary">{stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Why Choose ChainWeave AI?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the features that make ChainWeave AI the premier platform for cross-chain NFT creation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow bg-card border">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A diverse group of blockchain experts, AI engineers, and creative minds working together to build the future.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              >
                <Card className="h-full text-center hover:shadow-lg transition-shadow bg-card">
                  <CardHeader>
                    <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {member.role}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      {member.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Built on ZetaChain</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powered by the world's first omnichain blockchain, enabling true interoperability across all networks.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h3 className="text-2xl font-bold mb-6">Universal Smart Contracts</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <p className="text-muted-foreground">
                    Deploy once, interact with all blockchain networks
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <p className="text-muted-foreground">
                    Native Bitcoin, Ethereum, and BSC compatibility
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <p className="text-muted-foreground">
                    Secure cross-chain message passing
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <p className="text-muted-foreground">
                    Unified liquidity and asset management
                  </p>
                </div>
              </div>
            </div>
            <Card className="bg-card border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Code className="w-5 h-5 text-primary" />
                  <span>Smart Contract Architecture</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">ChainWeave.sol</span>
                    <Badge variant="outline">Core Contract</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">CrossChainMinter.sol</span>
                    <Badge variant="outline">Universal</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">ICrossChainMinter.sol</span>
                    <Badge variant="outline">Interface</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">IZetaConnector.sol</span>
                    <Badge variant="outline">ZetaChain</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="text-center"
          >
            <Card className="bg-card border">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold mb-4">Ready to Start Creating?</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join thousands of creators who are already using ChainWeave AI to mint stunning NFTs across multiple blockchains.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/dashboard">
                    <Button size="lg" className="w-full sm:w-auto">
                      Launch Dashboard
                    </Button>
                  </Link>
                  <Link href="/gallery">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Explore Gallery
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
      </div>
      <Footer />
    </>
  )
}
