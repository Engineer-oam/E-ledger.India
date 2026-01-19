const { query } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class TraceEvent {
  constructor(traceEventData) {
    this.id = traceEventData.id;
    this.eventId = traceEventData.event_id || traceEventData.eventId;
    this.batchId = traceEventData.batch_id || traceEventData.batchId;
    this.type = traceEventData.type;
    this.timestamp = traceEventData.timestamp;
    this.actorGln = traceEventData.actor_gln || traceEventData.actorGln;
    this.actorName = traceEventData.actor_name || traceEventData.actorName;
    this.location = traceEventData.location;
    this.txHash = traceEventData.tx_hash || traceEventData.txHash;
    this.previousHash = traceEventData.previous_hash || traceEventData.previousHash;
    this.metadata = traceEventData.metadata;
    this.returnReason = traceEventData.return_reason || traceEventData.returnReason;
    this.returnQuantity = traceEventData.return_quantity || traceEventData.returnQuantity;
    this.returnRecipientGln = traceEventData.return_recipient_gln || traceEventData.returnRecipientGln;
  }

  static async create(traceEventData) {
    const id = uuidv4();

    const sql = `
      INSERT INTO trace_events (
        id, event_id, batch_id, type, actor_gln, actor_name, location, 
        tx_hash, previous_hash, metadata, return_reason, return_quantity, 
        return_recipient_gln
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      id,
      traceEventData.eventId || traceEventData.event_id,
      traceEventData.batchId || traceEventData.batch_id,
      traceEventData.type,
      traceEventData.actorGln || traceEventData.actor_gln,
      traceEventData.actorName || traceEventData.actor_name,
      traceEventData.location,
      traceEventData.txHash || traceEventData.tx_hash,
      traceEventData.previousHash || traceEventData.previous_hash,
      traceEventData.metadata || {},
      traceEventData.returnReason || traceEventData.return_reason,
      traceEventData.returnQuantity || traceEventData.return_quantity,
      traceEventData.returnRecipientGln || traceEventData.return_recipient_gln
    ];

    const result = await query(sql, values);
    return new TraceEvent(result.rows[0]);
  }

  static async findByPk(id) {
    const sql = 'SELECT * FROM trace_events WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] ? new TraceEvent(result.rows[0]) : null;
  }

  static async findByEventId(eventId) {
    const sql = 'SELECT * FROM trace_events WHERE event_id = $1';
    const result = await query(sql, [eventId]);
    return result.rows[0] ? new TraceEvent(result.rows[0]) : null;
  }

  static async findByBatchId(batchId) {
    const sql = 'SELECT * FROM trace_events WHERE batch_id = $1 ORDER BY timestamp ASC';
    const result = await query(sql, [batchId]);
    return result.rows.map(row => new TraceEvent(row));
  }

  static async findByActorGln(gln, options = {}) {
    let sql = 'SELECT * FROM trace_events WHERE actor_gln = $1';
    const values = [gln];
    
    if (options.type) {
      sql += ' AND type = $2';
      values.push(options.type);
    }
    
    if (options.limit) {
      sql += ` ORDER BY timestamp DESC LIMIT $${values.length + 1}`;
      values.push(options.limit);
    } else {
      sql += ' ORDER BY timestamp ASC';
    }
    
    const result = await query(sql, values);
    return result.rows.map(row => new TraceEvent(row));
  }

  static async findAll(options = {}) {
    let sql = 'SELECT * FROM trace_events';
    const values = [];
    let paramCount = 0;

    if (options.filters) {
      const filters = [];
      if (options.filters.batchId) {
        paramCount++;
        filters.push(`batch_id = $${paramCount}`);
        values.push(options.filters.batchId);
      }
      if (options.filters.type) {
        paramCount++;
        filters.push(`type = $${paramCount}`);
        values.push(options.filters.type);
      }
      if (options.filters.actorGln) {
        paramCount++;
        filters.push(`actor_gln = $${paramCount}`);
        values.push(options.filters.actorGln);
      }
      if (filters.length > 0) {
        sql += ' WHERE ' + filters.join(' AND ');
      }
    }

    if (options.order) {
      sql += ` ORDER BY ${options.order}`;
    } else {
      sql += ' ORDER BY timestamp ASC';
    }

    if (options.limit) {
      sql += ` LIMIT $${paramCount + 1}`;
      values.push(options.limit);
    }

    const result = await query(sql, values);
    return result.rows.map(row => new TraceEvent(row));
  }

  static async delete(id) {
    const sql = 'DELETE FROM trace_events WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0] ? true : false;
  }

  toJSON() {
    return {
      id: this.id,
      eventId: this.eventId,
      batchId: this.batchId,
      type: this.type,
      timestamp: this.timestamp,
      actorGln: this.actorGln,
      actorName: this.actorName,
      location: this.location,
      txHash: this.txHash,
      previousHash: this.previousHash,
      metadata: this.metadata,
      returnReason: this.returnReason,
      returnQuantity: this.returnQuantity,
      returnRecipientGln: this.returnRecipientGln
    };
  }
}

module.exports = TraceEvent;