"use client";

import { GlobalReviews } from "../../../../features/customer/components/GlobalReviews";

export default function Reviews() {
  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      <GlobalReviews />
    </div>
  );
}
