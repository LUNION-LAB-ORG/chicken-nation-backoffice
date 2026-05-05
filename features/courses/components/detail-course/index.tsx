"use client";

import React from "react";

import { useCourseDetailQuery } from "../../queries/course-detail.query";
import type { Course, CourseWithAttempts } from "../../types/course.types";
import { CourseDetailHero } from "./CourseDetailHero";
import { CourseDetailSidebar } from "./CourseDetailSidebar";
import { CourseMapView } from "./CourseMapView";
import { CourseTimeline } from "./CourseTimeline";
import { DeliveriesList } from "./DeliveriesList";

interface Props {
  selectedItem: Course;
}

/**
 * Vue détail complète d'une course :
 *  - Hero (pickup code XXL + chips)
 *  - Map Google avec trajet + markers numérotés
 *  - Timeline chronologique complète (offer attempts, transitions, deliveries)
 *  - Liste des deliveries
 *  - Sidebar : livreur / récap / actions (force-assign / retry / cancel)
 *
 * La navigation retour vers la liste est gérée par CoursesHeader
 * (DashboardPageHeader mode="view" avec onBack) pour éviter le double bouton.
 */
export function CourseDetails({ selectedItem }: Props) {
  const { data: course, isLoading } = useCourseDetailQuery(selectedItem.id);

  // Préfère `course` (fraîche + offer_attempts). Fallback sur selectedItem pour éviter le flash.
  const c: CourseWithAttempts = course ?? { ...selectedItem, offer_attempts: [] };

  return (
    <div className="space-y-4">
      <CourseDetailHero course={c} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <CourseMapView course={c} />

          {isLoading && !course ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-8 animate-pulse h-48" />
          ) : (
            <CourseTimeline course={c} />
          )}

          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              Livraisons ({c.deliveries.length})
            </h3>
            <DeliveriesList deliveries={c.deliveries} />
          </div>
        </div>

        <CourseDetailSidebar course={c} />
      </div>
    </div>
  );
}
