"use client"

import { useState } from "react"
import { Filter, Search, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"

const chains = ["All Chains", "ZetaChain", "Ethereum", "Polygon", "BSC"]
const categories = ["All Categories", "Art", "Photography", "Music", "Gaming", "Collectibles"]
const sortOptions = ["Recently Added", "Price: High to Low", "Price: Low to High", "Most Liked", "Most Viewed"]

export function CollectionFilters() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedChain, setSelectedChain] = useState("All Chains")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [sortBy, setSortBy] = useState("Recently Added")
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="flex items-center space-x-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search collection..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-64 bg-background/50"
        />
      </div>

      {/* Quick Filters */}
      <div className="hidden md:flex items-center space-x-2">
        <Select value={selectedChain} onValueChange={setSelectedChain}>
          <SelectTrigger className="w-40 bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {chains.map((chain) => (
              <SelectItem key={chain} value={chain}>{chain}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-40 bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40 bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile Filter Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem>ZetaChain</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Ethereum</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Polygon</DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem>Art</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Photography</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Music</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Filters */}
      {(selectedChain !== "All Chains" || selectedCategory !== "All Categories") && (
        <div className="flex items-center space-x-2">
          {selectedChain !== "All Chains" && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedChain("All Chains")}>
              {selectedChain} ×
            </Badge>
          )}
          {selectedCategory !== "All Categories" && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedCategory("All Categories")}>
              {selectedCategory} ×
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
