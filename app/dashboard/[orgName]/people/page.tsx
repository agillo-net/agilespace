"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { PlusCircle, Search, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function PeoplePage() {
  const { orgName } = useParams()
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data for demonstration
  const people = [
    { id: 1, name: "Alex Johnson", email: "alex@example.com", role: "Developer", department: "Engineering", status: "Active" },
    { id: 2, name: "Jamie Smith", email: "jamie@example.com", role: "Designer", department: "Design", status: "Active" },
    { id: 3, name: "Taylor Brown", email: "taylor@example.com", role: "Manager", department: "Product", status: "On Leave" },
    { id: 4, name: "Casey Wilson", email: "casey@example.com", role: "QA Engineer", department: "Engineering", status: "Active" },
    { id: 5, name: "Jordan Lee", email: "jordan@example.com", role: "DevOps", department: "Operations", status: "Inactive" },
  ]

  // Filter people based on search query
  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.department.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">People</CardTitle>
            <CardDescription>
              Manage team members in {orgName} organization
            </CardDescription>
          </div>
          <Button asChild>
            <Link href={`/orgs/${orgName}/prople/new`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Person
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSearchQuery("Engineering")}>
                  Engineering
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSearchQuery("Design")}>
                  Design
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSearchQuery("Product")}>
                  Product
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSearchQuery("Operations")}>
                  Operations
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPeople.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://avatar.vercel.sh/${person.id}`} alt={person.name} />
                      <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{person.name}</div>
                      <div className="text-sm text-muted-foreground">{person.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{person.role}</TableCell>
                  <TableCell>{person.department}</TableCell>
                  <TableCell>
                    <Badge variant={person.status === "Active" ? "default" : person.status === "On Leave" ? "destructive" : "secondary"}>
                      {person.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/orgs/${orgName}/prople/${person.id}`}>
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPeople.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No people found. Try adjusting your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
