"use client"

import { motion } from "framer-motion"
import { 
  Brain, 
  Network, 
  Shield, 
  Zap, 
  Palette, 
  Coins,
  ArrowRight,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const mainFeatures = [
  {
    icon: Brain,
    title: "AI-Powered Generation",
    description: "Advanced machine learning algorithms create unique, high-quality NFT artwork tailored to your specifications.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  {
    icon: Network,
    title: "Cross-Chain Compatibility",
    description: "Seamlessly mint and transfer NFTs across multiple blockchain networks using ZetaChain's Universal Apps.",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10"
  },
  {
    icon: Shield,
    title: "Secure & Decentralized",
    description: "Built on ZetaChain's secure infrastructure with full decentralization and ownership control.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Generate and mint NFTs in seconds with optimized smart contracts and efficient processing.",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10"
  }
]

const benefits = [
  "No coding required - user-friendly interface",
  "Royalties automatically distributed across chains",
  "Built-in marketplace integration",
  "Advanced customization options",
  "Real-time preview and editing",
  "Batch creation and minting"
]

export function FeaturesSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge 
            variant="outline" 
            className="mb-4 px-4 py-2 text-sm font-medium border-primary/20 bg-primary/5 text-primary"
          >
            Why Choose ChainWeave AI
          </Badge>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Powerful Features for
            <span className="text-primary block">Modern NFT Creation</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Our platform combines cutting-edge AI technology with blockchain innovation 
            to provide the most advanced NFT creation experience available.
          </p>
        </motion.div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {mainFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 bg-card/50">
                <CardContent className="p-8">
                  <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-6`}>
                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Badge 
              variant="outline" 
              className="mb-4 px-4 py-2 text-sm font-medium border-emerald-500/20 bg-emerald-500/5 text-emerald-600"
            >
              Platform Benefits
            </Badge>
            
            <h3 className="text-2xl sm:text-3xl font-bold mb-6">
              Everything you need to succeed in the NFT space
            </h3>
            
            <p className="text-muted-foreground mb-8">
              ChainWeave AI provides all the tools and features necessary to create, 
              mint, and manage your NFT collections with professional-grade capabilities.
            </p>
            
            <div className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-500" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </motion.div>
              ))}
            </div>
            
            <Button className="group">
              Explore All Features
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="space-y-4">
              <Card className="p-6 border-0 bg-gradient-to-br from-primary/5 to-primary/10">
                <Palette className="w-8 h-8 text-primary mb-3" />
                <h4 className="font-semibold mb-2">Custom Styles</h4>
                <p className="text-sm text-muted-foreground">
                  Train AI on your unique art style
                </p>
              </Card>
              
              <Card className="p-6 border-0 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
                <Coins className="w-8 h-8 text-blue-500 mb-3" />
                <h4 className="font-semibold mb-2">Multi-Token</h4>
                <p className="text-sm text-muted-foreground">
                  Support for all major token standards
                </p>
              </Card>
            </div>
            
            <div className="space-y-4 mt-8">
              <Card className="p-6 border-0 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
                <Network className="w-8 h-8 text-purple-500 mb-3" />
                <h4 className="font-semibold mb-2">Omnichain</h4>
                <p className="text-sm text-muted-foreground">
                  True cross-chain functionality
                </p>
              </Card>
              
              <Card className="p-6 border-0 bg-gradient-to-br from-orange-500/5 to-orange-500/10">
                <Zap className="w-8 h-8 text-orange-500 mb-3" />
                <h4 className="font-semibold mb-2">Instant</h4>
                <p className="text-sm text-muted-foreground">
                  Real-time generation and minting
                </p>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
