import { adminDb } from './firebaseAdmin';
import fallbackAppletConfig from '../../firebase-applet-config.json';
import fs from 'node:fs';
import path from 'node:path';

// Helper to convert JS values to Firestore REST format
export function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: val.toString() };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

// Helper to convert Firestore REST values to JS
export function fromFirestoreValue(val: any): any {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return val.doubleValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('mapValue' in val) {
    const res: Record<string, any> = {};
    const fields = val.mapValue?.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      res[k] = fromFirestoreValue(v);
    }
    return res;
  }
  if ('arrayValue' in val) {
    return (val.arrayValue?.values || []).map(fromFirestoreValue);
  }
  return null;
}

export function fromFirestoreDoc(doc: any): any {
  if (!doc || !doc.fields) return null;
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    result[k] = fromFirestoreValue(v);
  }
  return result;
}

export class ServerFirestoreClient {
  private projectId: string;
  private databaseId: string;
  private baseUrl: string;

  constructor() {
    let pid = process.env.FIREBASE_PROJECT_ID;
    let dbId = process.env.FIRESTORE_DATABASE_ID;

    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (!pid && config.projectId) pid = config.projectId;
        if (!dbId && config.firestoreDatabaseId) dbId = config.firestoreDatabaseId;
      }
    } catch {
      // ignore
    }

    this.projectId = pid || fallbackAppletConfig?.projectId || 'gen-lang-client-0847187407';
    this.databaseId = dbId || (fallbackAppletConfig as any)?.firestoreDatabaseId || '(default)';
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/${this.databaseId}/documents`;
  }

  private getHeaders(authToken?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (authToken) {
      headers['Authorization'] = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
    }
    return headers;
  }

  async getDoc<T = any>(collection: string, docId: string, authToken?: string): Promise<{ exists: boolean; data: () => T | undefined }> {
    // 1. Try adminDb first if service account credentials exist
    try {
      const snap = await adminDb.collection(collection).doc(docId).get();
      return {
        exists: snap.exists,
        data: () => snap.data() as T
      };
    } catch (adminErr: any) {
      // If adminDb encounters permission error (e.g. sandbox ADC lacking roles), use REST API with auth token
      if (!authToken) {
        throw adminErr;
      }
    }

    const url = `${this.baseUrl}/${collection}/${encodeURIComponent(docId)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(authToken)
    });

    if (res.status === 404) {
      return {
        exists: false,
        data: () => undefined
      };
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Firestore REST get error (${res.status}): ${errText}`);
    }

    const json = await res.json();
    const data = fromFirestoreDoc(json) as T;
    return {
      exists: true,
      data: () => data
    };
  }

  async setDoc(collection: string, docId: string, data: Record<string, any>, authToken?: string): Promise<void> {
    try {
      await adminDb.collection(collection).doc(docId).set(data);
      return;
    } catch (adminErr: any) {
      if (!authToken) throw adminErr;
    }

    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }

    const url = `${this.baseUrl}/${collection}/${encodeURIComponent(docId)}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(authToken),
      body: JSON.stringify({ fields })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Firestore REST set error (${res.status}): ${errText}`);
    }
  }

  async updateDoc(collection: string, docId: string, updates: Record<string, any>, authToken?: string): Promise<void> {
    try {
      await adminDb.collection(collection).doc(docId).update(updates);
      return;
    } catch (adminErr: any) {
      if (!authToken) throw adminErr;
    }

    const fieldMask = Object.keys(updates).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }

    const url = `${this.baseUrl}/${collection}/${encodeURIComponent(docId)}?${fieldMask}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(authToken),
      body: JSON.stringify({ fields })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Firestore REST update error (${res.status}): ${errText}`);
    }
  }

  async deleteDoc(collection: string, docId: string, authToken?: string): Promise<void> {
    try {
      await adminDb.collection(collection).doc(docId).delete();
      return;
    } catch (adminErr: any) {
      if (!authToken) throw adminErr;
    }

    const url = `${this.baseUrl}/${collection}/${encodeURIComponent(docId)}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(authToken)
    });

    if (!res.ok && res.status !== 404) {
      const errText = await res.text();
      throw new Error(`Firestore REST delete error (${res.status}): ${errText}`);
    }
  }

  async queryDocs<T = any>(
    collection: string,
    filters: Array<{ field: string; op: '==' | '<=' | '>=' | '<' | '>'; value: any }>,
    authToken?: string
  ): Promise<Array<{ id: string; data: () => T }>> {
    try {
      let query: any = adminDb.collection(collection);
      for (const f of filters) {
        query = query.where(f.field, f.op, f.value);
      }
      const snap = await query.get();
      const results: Array<{ id: string; data: () => T }> = [];
      snap.forEach((d: any) => {
        results.push({
          id: d.id,
          data: () => d.data() as T
        });
      });
      return results;
    } catch (adminErr: any) {
      if (!authToken) throw adminErr;
    }

    const opMap: Record<string, string> = {
      '==': 'EQUAL',
      '<': 'LESS_THAN',
      '<=': 'LESS_THAN_OR_EQUAL',
      '>': 'GREATER_THAN',
      '>=': 'GREATER_THAN_OR_EQUAL'
    };

    const structuredFilters = filters.map(f => ({
      fieldFilter: {
        field: { fieldPath: f.field },
        op: opMap[f.op] || 'EQUAL',
        value: toFirestoreValue(f.value)
      }
    }));

    let whereClause: any = undefined;
    if (structuredFilters.length === 1) {
      whereClause = structuredFilters[0];
    } else if (structuredFilters.length > 1) {
      whereClause = {
        compositeFilter: {
          op: 'AND',
          filters: structuredFilters
        }
      };
    }

    const queryBody: Record<string, any> = {
      structuredQuery: {
        from: [{ collectionId: collection }]
      }
    };

    if (whereClause) {
      queryBody.structuredQuery.where = whereClause;
    }

    const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/${this.databaseId}/documents:runQuery`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(authToken),
      body: JSON.stringify(queryBody)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Firestore REST query error (${res.status}): ${errText}`);
    }

    const items = await res.json();
    const results: Array<{ id: string; data: () => T }> = [];

    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.document) {
          const nameParts = item.document.name.split('/');
          const docId = nameParts[nameParts.length - 1];
          const parsed = fromFirestoreDoc(item.document) as T;
          results.push({
            id: docId,
            data: () => parsed
          });
        }
      }
    }

    return results;
  }
}

export const serverDb = new ServerFirestoreClient();
