"use client";

import React, { useEffect, useState } from "react";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import CalenderCard from "@/components/integrations/CalenderCard";


export default function LinkGmailTelegramPage() {

  return (
    <ContentLayout title="Calendar">
      <CalenderCard />
    </ContentLayout>
  );
}
