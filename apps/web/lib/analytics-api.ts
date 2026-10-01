import { api } from "@/lib/api";

import type {
  PropertyAnalytics,
} from "@/types/models";

export const analyticsApi = {
  property: (
    propertyId: string | number,
  ) =>
    api
      .get<PropertyAnalytics>(
        `/analytic/property/${propertyId}`,
      )
      .then(
        (response) => response.data,
      ),
};