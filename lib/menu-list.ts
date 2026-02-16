import {
  Settings,
  LayoutGrid,
  LucideIcon,
  FilterIcon,
  Settings2,
  Receipt,
  Mail,
  Calendar1Icon,
  ChartNoAxesColumn,
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
        {
          href: "/email-analytics",
          label: "Email Analytics",
          icon: ChartNoAxesColumn,
        },
        
        {
          href: "/filters",
          label: "Filters",
          icon: FilterIcon,
        },
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
