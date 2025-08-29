"use client"

import { ChainWeaveLogo, ChainWeaveLogoCompact, ChainWeaveIcon } from "@/components/ui/chainweave-logo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function LogoShowcase() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Full Logo - Different Sizes */}
      <Card>
        <CardHeader>
          <CardTitle>Full Logo</CardTitle>
          <CardDescription>Various sizes with text</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <ChainWeaveLogo size="sm" href="/" />
              <Badge variant="outline">Small (Linked)</Badge>
            </div>
            <div className="flex items-center justify-between">
              <ChainWeaveLogo size="md" href="/" />
              <Badge variant="outline">Medium (Linked)</Badge>
            </div>
            <div className="flex items-center justify-between">
              <ChainWeaveLogo size="lg" href="/" />
              <Badge variant="outline">Large (Linked)</Badge>
            </div>
            <div className="flex items-center justify-between">
              <ChainWeaveLogo size="xl" href="/" />
              <Badge variant="outline">Extra Large (Linked)</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Compact Logo</CardTitle>
          <CardDescription>Icon only versions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <ChainWeaveLogoCompact size="sm" href="/" />
              <Badge variant="outline">Small (Linked)</Badge>
            </div>
            <div className="flex items-center justify-between">
              <ChainWeaveLogoCompact size="md" href="/" />
              <Badge variant="outline">Medium (Linked)</Badge>
            </div>
            <div className="flex items-center justify-between">
              <ChainWeaveLogoCompact size="lg" href="/" />
              <Badge variant="outline">Large (Linked)</Badge>
            </div>
            <div className="flex items-center justify-between">
              <ChainWeaveLogoCompact size="xl" href="/" />
              <Badge variant="outline">Extra Large (Linked)</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Variants</CardTitle>
          <CardDescription>Different theme styles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <ChainWeaveLogo variant="default" size="md" href="/" />
              <Badge variant="outline">Default (Linked)</Badge>
            </div>
            <div className="flex items-center justify-between bg-slate-900 p-2 rounded">
              <ChainWeaveLogo variant="white" size="md" href="/" />
              <Badge variant="outline">White (Linked)</Badge>
            </div>
            <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
              <ChainWeaveLogo variant="dark" size="md" href="/" />
              <Badge variant="outline">Dark (Linked)</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simple Icons */}
      <Card>
        <CardHeader>
          <CardTitle>Simple Icons</CardTitle>
          <CardDescription>Basic icon versions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-around">
            <ChainWeaveIcon size={16} />
            <ChainWeaveIcon size={24} />
            <ChainWeaveIcon size={32} />
            <ChainWeaveIcon size={48} />
          </div>
          <div className="text-center text-sm text-muted-foreground">
            16px, 24px, 32px, 48px
          </div>
        </CardContent>
      </Card>

      {/* Animated vs Static */}
      <Card>
        <CardHeader>
          <CardTitle>Animation States</CardTitle>
          <CardDescription>Animated vs static logos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <ChainWeaveLogo animated={true} size="md" />
              <Badge variant="outline">Animated</Badge>
            </div>
            <div className="flex items-center justify-between">
              <ChainWeaveLogo animated={false} size="md" />
              <Badge variant="outline">Static</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responsive Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Responsive Behavior</CardTitle>
          <CardDescription>How logo adapts to screen size</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="block sm:hidden">
            <ChainWeaveLogoCompact size="sm" />
            <p className="text-xs text-muted-foreground mt-2">Mobile: Compact</p>
          </div>
          <div className="hidden sm:block md:hidden">
            <ChainWeaveLogo size="sm" />
            <p className="text-xs text-muted-foreground mt-2">Tablet: Small</p>
          </div>
          <div className="hidden md:block lg:hidden">
            <ChainWeaveLogo size="md" />
            <p className="text-xs text-muted-foreground mt-2">Desktop: Medium</p>
          </div>
          <div className="hidden lg:block">
            <ChainWeaveLogo size="lg" />
            <p className="text-xs text-muted-foreground mt-2">Large: Large</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
