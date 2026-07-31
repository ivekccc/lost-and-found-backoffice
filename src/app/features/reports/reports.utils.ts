import { AdminReportListDto, ReportDetailsDto } from '@lost-and-found/api';

export function mapReportDetailsToListItem(report: ReportDetailsDto): AdminReportListDto {
  return {
    id: report.id,
    title: report.title,
    type: report.type,
    categoryName: report.categoryName,
    status: report.status,
    location: report.location,
    createdAt: report.createdAt,
    ownerId: report.userId,
    ownerName: report.userFullName,
  };
}
