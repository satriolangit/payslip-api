const repo = require("../repositories/ideaboxRepository");
const queryPdf = require("../queries/ideaboxPdfQuery");

const getReportData = async (startDate, endDate, type) => {
  const ideaboxIds = await repo.getClosedIdeaboxIdByDateAndType(
    startDate,
    endDate,
    type
  );

  let result = [];

  for (let i = 0; i < ideaboxIds.length; i++) {
    const item = ideaboxIds[i];

    const ideabox = await queryPdf.getData(item.id);
    result = [...result, ideabox];
  }

  return result;
};

module.exports = { getReportData };
