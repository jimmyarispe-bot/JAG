/**
 * Side-effect registration of profile kinds only.
 * Safe for instrumentation / registry bootstrap — does not import next/headers.
 */

import "@/lib/students/profile/register";
import "@/lib/students/profile/contributions";
import "@/lib/employees/profile/register";
import "@/lib/families/profile/register";
import "@/lib/admissions/profile/register";
