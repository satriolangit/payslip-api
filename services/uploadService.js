const db = require("../config/database");
const moment = require("moment");

const isFileExist = async filename => {
  const sql = "SELECT filename FROM upload WHERE filename = ?";
  const result = await db.query(sql, filename);

  return result.length > 0;
};

const createUpload = async (filename, path, createdBy) => {
  const now = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");

  const sql =
    "INSERT INTO upload (filename, path, created_time, created_by) VALUES (?, ?, ?, ?)";

  db.query(sql, [filename, path, now, createdBy]);
};

const removeUpload = async id => {
  const sql = "DELETE FROM upload WHERE id = ?";
  db.query(sql, id);
};

const getUploadCount = async () => {
  const sql = "SELECT COUNT(*) AS total FROM upload";

  const query = await db.query(sql);

  return query[0].total;
};

const getUploadData = async () => {
  const sql =
    "SELECT id, filename, path, created_time, created_by, concat(id, ';', filename) as idx FROM upload ORDER BY filename";
  return db.query(sql);
};

const getUploadDataByPage = async (numPerPage, page) => {
  const sql =
    "SELECT id, filename, path, created_time, created_by, concat(id, ';', filename) as idx FROM upload ORDER BY filename LIMIT ? OFFSET ?";
  return db.query(sql), [numPerPage, page];
};

const getUploadByFilename = async filename => {
  const sql =
    "SELECT id, filename, path, created_time, created_by, concat(id, ';', filename) as idx FROM upload WHERE filename = ? ORDER BY filename";
  return db.query(sql, filename);
};

const searchFiles = async keywords => {
  const sql =
    "SELECT id, filename, path, created_time, created_by, concat(id, ';', filename) as idx FROM upload WHERE filename LIKE ? ORDER BY filename";
  return db.query(sql, "%" + keywords + "%");
};

module.exports = {
  getUploadData,
  getUploadByFilename,
  getUploadDataByPage,
  getUploadCount,
  createUpload,
  removeUpload,
  searchFiles,
  isFileExist
};
