"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search } from "lucide-react";
import { useGithubStore } from "@/store/github-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IssueSearchProps {
  onSearch: (query: string, orgs: string[]) => void;
}

const formSchema = z.object({
  query: z.string().min(1, "Search term is required"),
  org: z.string().optional(),
});

export function IssueSearch({ onSearch }: IssueSearchProps) {
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const { orgs, isLoadingOrgs, fetchUserOrgs } = useGithubStore();

  useEffect(() => {
    fetchUserOrgs();
  }, [fetchUserOrgs]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: "",
      org: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const orgFilter = values.org ? [values.org] : orgs.map(org => org.login);
    onSearch(values.query, orgFilter);
  };

  const handleOrgChange = (value: string) => {
    setSelectedOrg(value);
    form.setValue("org", value);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-3">
            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search GitHub issues..."
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div>
            <Select value={selectedOrg} onValueChange={handleOrgChange}>
              <SelectTrigger>
                <SelectValue placeholder="All organizations" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All organizations</SelectItem>
                  {isLoadingOrgs ? (
                    <SelectItem value="all" disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    orgs.map((org) => (
                      <SelectItem key={org.login} value={org.login}>
                        {org.name || org.login}
                      </SelectItem>
                    ))
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="submit">Search</Button>
      </form>
    </Form>
  );
}
