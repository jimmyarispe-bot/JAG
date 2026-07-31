import type {
  AcademicRepository,
  AssessmentRecord,
  CourseRecord,
  SectionRecord,
} from "@/applications/academyos/domain/repositories";
import {
  ACADEMYOS_TABLES,
  type DatabaseProvider,
} from "@/applications/academyos/infrastructure/database";
import {
  AssessmentMapper,
  CourseMapper,
  SectionMapper,
} from "@/applications/academyos/infrastructure/persistence/mapping";

export class SupabaseAcademicRepository implements AcademicRepository {
  constructor(private readonly db: DatabaseProvider) {}

  async getCourse(id: string) {
    const row = await this.db.from(ACADEMYOS_TABLES.courses).findById(id);
    return row ? CourseMapper.rowToDomain(row) : null;
  }

  async saveCourse(record: CourseRecord) {
    return CourseMapper.rowToDomain(
      await this.db
        .from(ACADEMYOS_TABLES.courses)
        .upsert(CourseMapper.domainToRow(record))
    );
  }

  async getSection(id: string) {
    const row = await this.db.from(ACADEMYOS_TABLES.sections).findById(id);
    return row ? SectionMapper.rowToDomain(row) : null;
  }

  async saveSection(record: SectionRecord) {
    return SectionMapper.rowToDomain(
      await this.db
        .from(ACADEMYOS_TABLES.sections)
        .upsert(SectionMapper.domainToRow(record))
    );
  }

  async getAssessment(id: string) {
    const row = await this.db.from(ACADEMYOS_TABLES.assessments).findById(id);
    return row ? AssessmentMapper.rowToDomain(row) : null;
  }

  async saveAssessment(record: AssessmentRecord) {
    return AssessmentMapper.rowToDomain(
      await this.db
        .from(ACADEMYOS_TABLES.assessments)
        .upsert(AssessmentMapper.domainToRow(record))
    );
  }
}
