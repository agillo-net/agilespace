'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Organization {
  id: number;
  login: string;
  avatar_url?: string;
}

interface IssueSearchProps {
  onSearch: (query: string, organization: string) => void;
}

export function IssueSearch({ onSearch }: IssueSearchProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/github/orgs');
        if (response.ok) {
          const orgs = await response.json();
          setOrganizations(orgs);
          if (orgs.length > 0) {
            setSelectedOrg(orgs[0].login);
          }
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrganizations();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery, selectedOrg);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSearch} className="relative">
        <div className="flex items-center border rounded-lg shadow-sm overflow-hidden bg-background">
          <Select
            value={selectedOrg}
            onValueChange={setSelectedOrg}
            disabled={loading || organizations.length === 0}
          >
            <SelectTrigger className="w-[160px] border-0 focus:ring-0 rounded-none">
              <SelectValue placeholder="Organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.login}>
                  {org.login}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="w-px h-6 bg-muted mx-1"></div>
          
          <Input
            type="text"
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3"
          />
          
          <Button type="submit" variant="ghost" size="icon" className="mr-1">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
