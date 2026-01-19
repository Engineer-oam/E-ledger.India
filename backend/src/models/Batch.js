const { query } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const TraceEvent = require('./TraceEvent');

class Batch {
  constructor(batchData) {
    this.id = batchData.id;
    this.batchId = batchData.batch_id || batchData.batchId;
    this.gtin = batchData.gtin;
    this.lotNumber = batchData.lot_number || batchData.lotNumber;
    this.blockchainId = batchData.blockchain_id || batchData.blockchainId;
    this.genesisHash = batchData.genesis_hash || batchData.genesisHash;
    this.productName = batchData.product_name || batchData.productName;
    this.quantity = batchData.quantity;
    this.unit = batchData.unit;
    this.expiryDate = batchData.expiry_date || batchData.expiryDate;
    this.manufacturerGln = batchData.manufacturer_gln || batchData.manufacturerGln;
    this.currentOwnerGln = batchData.current_owner_gln || batchData.currentOwnerGln;
    this.intendedRecipientGln = batchData.intended_recipient_gln || batchData.intendedRecipientGln;
    this.status = batchData.status;
    this.sector = batchData.sector;
    this.country = batchData.country;
    this.alcoholContent = batchData.alcohol_content || batchData.alcoholContent;
    this.category = batchData.category;
    this.dosageForm = batchData.dosage_form || batchData.dosageForm;
    this.serialNumber = batchData.serial_number || batchData.serialNumber;
    this.hsnCode = batchData.hsn_code || batchData.hsnCode;
    this.taxableValue = batchData.taxable_value || batchData.taxableValue;
    this.taxRate = batchData.tax_rate || batchData.taxRate;
    this.taxAmount = batchData.tax_amount || batchData.taxAmount;
    this.dutyPaid = batchData.duty_paid || batchData.dutyPaid;
    this.integrityHash = batchData.integrity_hash || batchData.integrityHash;
    this.totalReturnedQuantity = batchData.total_returned_quantity || batchData.totalReturnedQuantity;
    this.createdAt = batchData.created_at || batchData.createdAt;
    this.updatedAt = batchData.updated_at || batchData.updatedAt;
  }

  static async create(batchData) {
    const id = uuidv4();

    const sql = `
      INSERT INTO batches (
        id, batch_id, gtin, lot_number, blockchain_id, genesis_hash, product_name,
        quantity, unit, expiry_date, manufacturer_gln, current_owner_gln, 
        intended_recipient_gln, status, sector, country, alcohol_content, 
        category, dosage_form, serial_number, hsn_code, taxable_value, 
        tax_rate, tax_amount, duty_paid, integrity_hash, total_returned_quantity
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      RETURNING *
    `;

    const values = [
      id,
      batchData.batchId || batchData.batch_id,
      batchData.gtin,
      batchData.lotNumber || batchData.lot_number,
      batchData.blockchainId || batchData.blockchain_id,
      batchData.genesisHash || batchData.genesis_hash,
      batchData.productName || batchData.product_name,
      batchData.quantity,
      batchData.unit,
      batchData.expiryDate || batchData.expiry_date,
      batchData.manufacturerGln || batchData.manufacturer_gln,
      batchData.currentOwnerGln || batchData.current_owner_gln,
      batchData.intendedRecipientGln || batchData.intended_recipient_gln,
      batchData.status,
      batchData.sector,
      batchData.country,
      batchData.alcoholContent || batchData.alcohol_content,
      batchData.category,
      batchData.dosageForm || batchData.dosage_form,
      batchData.serialNumber || batchData.serial_number,
      batchData.hsnCode || batchData.hsn_code,
      batchData.taxableValue || batchData.taxable_value,
      batchData.taxRate || batchData.tax_rate,
      batchData.taxAmount || batchData.tax_amount,
      batchData.dutyPaid || batchData.duty_paid,
      batchData.integrityHash || batchData.integrity_hash,
      batchData.totalReturnedQuantity || batchData.total_returned_quantity
    ];

    const result = await query(sql, values);
    return new Batch(result.rows[0]);
  }

  static async findByPk(id) {
    const sql = 'SELECT * FROM batches WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] ? new Batch(result.rows[0]) : null;
  }

  static async findByBatchId(batchId) {
    const sql = 'SELECT * FROM batches WHERE batch_id = $1';
    const result = await query(sql, [batchId]);
    return result.rows[0] ? new Batch(result.rows[0]) : null;
  }

  static async findByGtinAndLot(gtin, lotNumber) {
    const sql = 'SELECT * FROM batches WHERE gtin = $1 AND lot_number = $2';
    const result = await query(sql, [gtin, lotNumber]);
    return result.rows[0] ? new Batch(result.rows[0]) : null;
  }

  static async findByOwnerGln(gln, options = {}) {
    let sql = 'SELECT * FROM batches WHERE current_owner_gln = $1';
    const values = [gln];
    
    if (options.includeTraceEvents) {
      // We'll need to join with trace events or fetch them separately
      sql = `
        SELECT b.*, json_agg(te.*) as trace_events 
        FROM batches b 
        LEFT JOIN trace_events te ON b.batch_id = te.batch_id 
        WHERE b.current_owner_gln = $1 
        GROUP BY b.id
      `;
    }
    
    if (options.status) {
      sql += ' AND status = $2';
      values.push(options.status);
    }
    
    const result = await query(sql, values);
    return result.rows.map(row => {
      const batch = new Batch(row);
      if (row.trace_events && Array.isArray(row.trace_events) && row.trace_events[0]?.id) {
        batch.traceEvents = row.trace_events.map(te => new TraceEvent(te));
      }
      return batch;
    });
  }

  static async findAll(options = {}) {
    let sql = 'SELECT * FROM batches';
    const values = [];
    let paramCount = 0;

    if (options.filters) {
      const filters = [];
      if (options.filters.status) {
        paramCount++;
        filters.push(`status = $${paramCount}`);
        values.push(options.filters.status);
      }
      if (options.filters.sector) {
        paramCount++;
        filters.push(`sector = $${paramCount}`);
        values.push(options.filters.sector);
      }
      if (options.filters.manufacturerGln) {
        paramCount++;
        filters.push(`manufacturer_gln = $${paramCount}`);
        values.push(options.filters.manufacturerGln);
      }
      if (options.filters.currentOwnerGln) {
        paramCount++;
        filters.push(`current_owner_gln = $${paramCount}`);
        values.push(options.filters.currentOwnerGln);
      }
      if (filters.length > 0) {
        sql += ' WHERE ' + filters.join(' AND ');
      }
    }

    if (options.order) {
      sql += ` ORDER BY ${options.order}`;
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    if (options.limit) {
      sql += ` LIMIT $${paramCount + 1}`;
      values.push(options.limit);
    }

    const result = await query(sql, values);
    return result.rows.map(row => new Batch(row));
  }

  static async update(id, updateData) {
    const updates = [];
    const values = [id];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (key !== 'id' && key !== 'createdAt' && key !== 'batchId') {
        paramCount++;
        updates.push(`${snakeCase(key)} = $${paramCount}`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    const sql = `UPDATE batches SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;
    const result = await query(sql, values);
    return result.rows[0] ? new Batch(result.rows[0]) : null;
  }

  static async updateByBatchId(batchId, updateData) {
    const updates = [];
    const values = [batchId];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (key !== 'batchId' && key !== 'createdAt' && key !== 'id') {
        paramCount++;
        updates.push(`${snakeCase(key)} = $${paramCount}`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    const sql = `UPDATE batches SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE batch_id = $1 RETURNING *`;
    const result = await query(sql, values);
    return result.rows[0] ? new Batch(result.rows[0]) : null;
  }

  static async delete(id) {
    const sql = 'DELETE FROM batches WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0] ? true : false;
  }

  async getTraceEvents() {
    return await TraceEvent.findByBatchId(this.batchId);
  }

  toJSON() {
    return {
      id: this.id,
      batchId: this.batchId,
      gtin: this.gtin,
      lotNumber: this.lotNumber,
      blockchainId: this.blockchainId,
      genesisHash: this.genesisHash,
      productName: this.productName,
      quantity: this.quantity,
      unit: this.unit,
      expiryDate: this.expiryDate,
      manufacturerGln: this.manufacturerGln,
      currentOwnerGln: this.currentOwnerGln,
      intendedRecipientGln: this.intendedRecipientGln,
      status: this.status,
      sector: this.sector,
      country: this.country,
      alcoholContent: this.alcoholContent,
      category: this.category,
      dosageForm: this.dosageForm,
      serialNumber: this.serialNumber,
      hsnCode: this.hsnCode,
      taxableValue: this.taxableValue,
      taxRate: this.taxRate,
      taxAmount: this.taxAmount,
      dutyPaid: this.dutyPaid,
      integrityHash: this.integrityHash,
      totalReturnedQuantity: this.totalReturnedQuantity,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Helper function to convert camelCase to snake_case
function snakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

module.exports = Batch;