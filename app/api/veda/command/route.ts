import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { classifyCommand, phraseReply } from '@/lib/llm';
import { formatRupees } from '@/lib/money';
import * as analytics from '@/lib/analytics';

// The main orchestration route
export async function POST(req: Request) {
  try {
    const { text, lang = 'en', merchantId = 1 } = await req.json();

    const { result: classification, provider: classifyProvider } = await classifyCommand(text, lang);
    const { intent, entities } = classification;
    
    let data: any = {};
    let replyText = '';
    let uiAction: any = null;
    let provider = classifyProvider;

    switch (intent) {
      case 'GET_SALES': {
        const period = (entities.period as analytics.Period) || 'today';
        data = await analytics.salesSummary(db, merchantId, period);
        uiAction = { type: 'SALES_CARD', payload: data };
        const template = `Your sales for ${period} are ${formatRupees(data.revenue)} from ${data.orderCount} orders.`;
        const res = await phraseReply(data, lang, intent, template);
        replyText = res.text;
        provider += `+${res.provider}`;
        break;
      }
      
      case 'GET_PROFIT': {
        const period = (entities.period as analytics.Period) || 'today';
        data = await analytics.profitSummary(db, merchantId, period);
        uiAction = { type: 'PROFIT_CARD', payload: data };
        const template = `Your profit for ${period} is ${formatRupees(data.netProfit)} with a ${data.marginPct}% margin.`;
        const res = await phraseReply(data, lang, intent, template);
        replyText = res.text;
        provider += `+${res.provider}`;
        break;
      }

      case 'PROFIT_DIAGNOSIS': {
        const period = (entities.period as analytics.Period) || 'month';
        data = await analytics.profitDiagnosis(db, merchantId, period);
        uiAction = { type: 'DIAGNOSIS_CHART', payload: data };
        const res = await phraseReply(data, lang, intent);
        replyText = res.text;
        provider += `+${res.provider}`;
        break;
      }

      case 'STOP_SELLING':
      case 'SELL_MORE': {
        data = await analytics.productPerformance(db, merchantId);
        uiAction = { type: 'PRODUCTS_TABLE', payload: data };
        const res = await phraseReply(data, lang, intent);
        replyText = res.text;
        provider += `+${res.provider}`;
        break;
      }

      case 'LOG_CREDIT': {
        // Create an Udhaar entry
        const amount = Number(entities.amount) || 0;
        const customerName = entities.customer || 'Unknown';
        
        let customer = await db.customer.findFirst({ where: { merchantId, name: { contains: customerName } } });
        if (!customer) customer = await db.customer.create({ data: { merchantId, name: customerName } });
        
        const entry = await db.creditEntry.create({
          data: { customerId: customer.id, amountPaise: amount, type: 'GIVEN' }
        });
        
        await db.undoLog.create({ data: { action: 'LOG_CREDIT', referenceId: entry.id } });
        
        data = { customerName: customer.name, amount };
        uiAction = { type: 'CONFIRM_WRITE', payload: data };
        replyText = `Recorded ${formatRupees(amount)} credit for ${customer.name}.`;
        break;
      }
      
      case 'RECEIVE_PAYMENT': {
        const amount = Number(entities.amount) || 0;
        const customerName = entities.customer || 'Unknown';
        
        let customer = await db.customer.findFirst({ where: { merchantId, name: { contains: customerName } } });
        if (!customer) customer = await db.customer.create({ data: { merchantId, name: customerName } });
        
        const entry = await db.creditEntry.create({
          data: { customerId: customer.id, amountPaise: amount, type: 'RECEIVED' }
        });
        
        await db.undoLog.create({ data: { action: 'RECEIVE_PAYMENT', referenceId: entry.id } });
        
        data = { customerName: customer.name, amount };
        uiAction = { type: 'CONFIRM_WRITE', payload: data };
        replyText = `Recorded ${formatRupees(amount)} payment received from ${customer.name}.`;
        break;
      }

      case 'UNDO': {
        // Find last undoable action
        const log = await db.undoLog.findFirst({ where: { undone: false }, orderBy: { id: 'desc' } });
        if (log) {
          if (log.action === 'LOG_CREDIT' || log.action === 'RECEIVE_PAYMENT') {
            await db.creditEntry.update({ where: { id: log.referenceId }, data: { isUndo: true } });
          }
          await db.undoLog.update({ where: { id: log.id }, data: { undone: true } });
          replyText = "Reversed the last action.";
        } else {
          replyText = "Nothing to undo.";
        }
        uiAction = null;
        break;
      }
      
      case 'STOP_SPEAKING': {
        replyText = '';
        uiAction = null;
        break;
      }

      default: {
        replyText = "I'm not sure how to answer that yet.";
        break;
      }
    }

    // Log the voice command
    await db.voiceLog.create({ data: { text, intent, provider } });

    return NextResponse.json({ intent, entities, data, replyText, uiAction, provider });
  } catch (error: any) {
    console.error('Command API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
