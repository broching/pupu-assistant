import {
  Tag,
  Users,
  Settings,
  Bookmark,
  SquarePen,
  LayoutGrid,
  LucideIcon,
  User
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutGrid,
          submenus: []
        }
      ]
    },
    {
      groupLabel: "Workflow",
      menus: [
        {
          href: "/integrations",
          label: "Integrations",
          icon: SquarePen,
        },
        // {
        //   href: "",
        //   label: "Pods",
        //   icon: SquarePen,
        //   submenus: [
        //     {
        //       href: "/listing",
        //       label: "All Listings"
        //     },
        //     {
        //       href: "/listing-new",
        //       label: "New Listing"
        //     }
        //   ]
        // },
      ]
    },
    {
      groupLabel: "Settings",
      menus: [
        {
          href: "/account",
          label: "Account",
          icon: Settings
        }
      ]
    }
  ];
}
