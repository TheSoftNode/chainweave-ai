"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Shield, 
  Activity, 
  Send, 
  ArrowDownToLine, 
  TrendingUp,
  Download,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const connectedWallets = [
  {
    id: 1,
    name: "MetaMask",
    address: "0x742d35Cc6834C0532925a3b8117D3C39E3B8",
    balance: "2.45 ETH",
    usdValue: "$4,158.50",
    status: "connected",
    isPrimary: true,
    network: "Ethereum",
    avatar: "M"
  },
  {
    id: 2,
    name: "ZetaChain Wallet",
    address: "0x1a2b3c4d5e6f7890abcdef1234567890fedcba09",
    balance: "156.7 ZETA",
    usdValue: "$234.50",
    status: "connected",
    isPrimary: false,
    network: "ZetaChain",
    avatar: "Z"
  }
]

const recentTransactions = [
  {
    id: 1,
    type: "sale",
    description: "Sold Cosmic Dream #001",
    amount: "+0.5 ETH",
    usdAmount: "+$847.50",
    timestamp: "2 hours ago",
    status: "completed",
    hash: "0x1234...5678",
    network: "ZetaChain"
  },
  {
    id: 2,
    type: "mint",
    description: "Minted Neural Network #128",
    amount: "-0.02 ETH",
    usdAmount: "-$33.90",
    timestamp: "5 hours ago",
    status: "completed",
    hash: "0xabcd...efgh",
    network: "Ethereum"
  },
  {
    id: 3,
    type: "transfer",
    description: "Transferred to external wallet",
    amount: "-0.1 ETH",
    usdAmount: "-$169.50",
    timestamp: "1 day ago",
    status: "pending",
    hash: "0x9876...5432",
    network: "ZetaChain"
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "text-emerald-600"
    case "pending":
      return "text-yellow-600"
    case "failed":
      return "text-red-600"
    default:
      return "text-gray-600"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4 text-emerald-600" />
    case "pending":
      return <Clock className="w-4 h-4 text-yellow-600" />
    case "failed":
      return <AlertTriangle className="w-4 h-4 text-red-600" />
    default:
      return null
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "sale":
      return "💰"
    case "mint":
      return "✨"
    case "transfer":
      return "📤"
    case "receive":
      return "📥"
    default:
      return "📋"
  }
}

export function WalletDashboard() {
  const [selectedNetwork, setSelectedNetwork] = useState("all")
  const [gasSettings, setGasSettings] = useState("standard")
  const [notifications, setNotifications] = useState(true)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$4,393.00</div>
              <div className="flex items-center text-sm text-emerald-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +5.2% from last month
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connectedWallets.length}</div>
              <div className="text-sm text-muted-foreground">
                All secured and verified
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <div className="text-sm text-muted-foreground">
                Transactions completed
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="wallets" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="networks">Networks</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Wallets Tab */}
        <TabsContent value="wallets" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Connected Wallets</CardTitle>
                    <CardDescription>Manage your connected wallets and addresses</CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {connectedWallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className="flex items-center justify-between p-4 border border-primary/20 rounded-lg bg-card/50"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white">
                          {wallet.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{wallet.name}</h4>
                          {wallet.isPrimary && (
                            <Badge variant="default" className="text-xs">Primary</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">{wallet.network}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">
                          {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm font-medium">{wallet.balance}</span>
                          <span className="text-sm text-muted-foreground">{wallet.usdValue}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(wallet.address)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Actions
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Send className="w-4 h-4 mr-2" />
                            Send Assets
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ArrowDownToLine className="w-4 h-4 mr-2" />
                            Receive Assets
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on Explorer
                          </DropdownMenuItem>
                          {!wallet.isPrimary && (
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Disconnect
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Your latest wallet activity and transactions</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Networks</SelectItem>
                        <SelectItem value="ethereum">Ethereum</SelectItem>
                        <SelectItem value="zetachain">ZetaChain</SelectItem>
                        <SelectItem value="polygon">Polygon</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border border-primary/10 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-lg">{getTypeIcon(transaction.type)}</span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{transaction.description}</h4>
                            {getStatusIcon(transaction.status)}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{transaction.timestamp}</span>
                            <span className="font-mono">{transaction.hash}</span>
                            <Badge variant="outline" className="text-xs">{transaction.network}</Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`font-medium ${
                          transaction.amount.startsWith('+') ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {transaction.amount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.usdAmount}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Networks Tab */}
        <TabsContent value="networks" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Preferred Networks</CardTitle>
                <CardDescription>Configure your blockchain network preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { name: "ZetaChain", status: "active", color: "bg-emerald-500", rpc: "https://zetachain-evm.blockpi.network/v1/rpc/public" },
                  { name: "Ethereum", status: "active", color: "bg-blue-500", rpc: "https://mainnet.infura.io/v3/..." },
                  { name: "Polygon", status: "inactive", color: "bg-purple-500", rpc: "https://polygon-rpc.com" },
                  { name: "BSC", status: "inactive", color: "bg-yellow-500", rpc: "https://bsc-dataseed.binance.org" }
                ].map((network) => (
                  <div key={network.name} className="flex items-center justify-between p-4 border border-primary/10 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-4 h-4 ${network.color} rounded-full`} />
                      <div>
                        <div className="font-medium">{network.name}</div>
                        <div className="text-sm text-muted-foreground font-mono">{network.rpc}</div>
                      </div>
                    </div>
                    <Switch checked={network.status === "active"} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Transaction Settings</CardTitle>
                <CardDescription>Configure your transaction and security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Default Gas Setting</Label>
                  <Select value={gasSettings} onValueChange={setGasSettings}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Slow (Lower fees)</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="fast">Fast (Higher fees)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Transaction Notifications</Label>
                    <div className="text-sm text-muted-foreground">
                      Get notified about transaction status
                    </div>
                  </div>
                  <Switch checked={notifications} onCheckedChange={setNotifications} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto-approve small transactions</Label>
                    <div className="text-sm text-muted-foreground">
                      Skip confirmation for transactions under $10
                    </div>
                  </div>
                  <Switch />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Security</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-between">
                      <span>Export Private Keys</span>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between">
                      <span>Backup Wallet</span>
                      <Shield className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
