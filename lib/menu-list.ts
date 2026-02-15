import {
  Settings,
  LayoutGrid,
  LucideIcon,
  FilterIcon,
  Settings2,
  Receipt,
  Mail,
  Calendar1Icon,
} from "lucide-react";
import { FaTelegramPlane } from "react-icons/fa";
import { IconType } from "react-icons/lib";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: LucideIcon | IconType;
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
        // {
        //   href: "/integrations",
        //   label: "Integrations",
        //   icon: Settings2,
        // },
        {
          href: "/telegram",
          label: "Telegram",
          icon: FaTelegramPlane,
        },
        {
          href: "/calendar",
          label: "Calendar",
          icon: Calendar1Icon,
        },
        {
          href: "/email",
          label: "Email",
          icon: Mail,
        },
        // {
        //   href: "/integrations",
        //   label: "Integrations",
        //   icon: Settings2,
        // },
        {
          href: "/filters",
          label: "Filters",
          icon: FilterIcon,
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
        },
        {
          href: "/billing",
          label: "Billing",
          icon: Receipt
        }
      ]
    }
  ];
}
