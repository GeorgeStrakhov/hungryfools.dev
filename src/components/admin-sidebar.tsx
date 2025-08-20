"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  FlaskConical,
  Brain,
  Mail,
  Image,
  Upload,
  Mic,
  ArrowLeft,
  Megaphone,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

interface AdminNavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: Array<{
    title: string;
    url: string;
    icon?: React.ComponentType<{ className?: string }>;
  }>;
}

interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

const adminNavItems: AdminNavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        title: "Users",
        url: "/admin/users",
        icon: Users,
      },
      {
        title: "Companies",
        url: "/admin/companies",
        icon: Users,
      },
      {
        title: "Site Banner",
        url: "/admin/banner",
        icon: Megaphone,
      },
    ],
  },
  {
    title: "Developer Tools",
    items: [
      {
        title: "Testing",
        url: "/admin/testing",
        icon: FlaskConical,
        subItems: [
          {
            title: "Overview",
            url: "/admin/testing",
          },
          {
            title: "Embeddings",
            url: "/admin/testing/embeddings",
            icon: Brain,
          },
          {
            title: "LLM",
            url: "/admin/testing/llm",
            icon: FlaskConical,
          },
          {
            title: "Email",
            url: "/admin/testing/email",
            icon: Mail,
          },
          {
            title: "Images",
            url: "/admin/testing/replicate",
            icon: Image,
          },
          {
            title: "File Upload",
            url: "/admin/testing/s3",
            icon: Upload,
          },
          {
            title: "Speech",
            url: "/admin/testing/speech",
            icon: Mic,
          },
        ],
      },
    ],
  },
];

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">HungryFools Admin</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {adminNavItems.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.url ||
                    (item.subItems &&
                      item.subItems.some(
                        (subItem) => pathname === subItem.url,
                      ));
                  const Icon = item.icon;

                  // If item has subItems, render as collapsible
                  if (item.subItems) {
                    return (
                      <Collapsible
                        key={item.title}
                        defaultOpen={pathname.startsWith(item.url)}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton className="flex w-full items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {item.title}
                              <ChevronRight className="ml-auto h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenu className="mt-1 ml-4">
                              {item.subItems.map((subItem) => {
                                const isSubActive = pathname === subItem.url;
                                const SubIcon = subItem.icon;

                                return (
                                  <SidebarMenuItem key={subItem.title}>
                                    <SidebarMenuButton
                                      asChild
                                      isActive={isSubActive}
                                      size="sm"
                                    >
                                      <Link
                                        href={subItem.url}
                                        className="flex items-center gap-2"
                                      >
                                        {SubIcon && (
                                          <SubIcon className="h-3 w-3" />
                                        )}
                                        {subItem.title}
                                      </Link>
                                    </SidebarMenuButton>
                                  </SidebarMenuItem>
                                );
                              })}
                            </SidebarMenu>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  // Regular menu item
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link
                          href={item.url}
                          className="flex items-center gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          {item.title}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="w-full">
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Site
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
