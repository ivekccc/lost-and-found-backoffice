import { ReportDetailsDto, ReportListDto } from '@lost-and-found/api';

export function mapReportDetailsToListItem(report: ReportDetailsDto): ReportListDto {
  return {
    id: report.id,
    title: report.title,
    type: report.type,
    categoryName: report.categoryName,
    status: report.status,
    location: report.location,
    createdAt: report.createdAt,
    thumbnailUrl: report.images?.[0]?.imageUrl,
  };
}
