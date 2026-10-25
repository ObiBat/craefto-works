import "server-only";
import { join } from "node:path";
import { Document, Font, G, Page, Path, StyleSheet, Svg, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { MARK_PATH } from "@/components/ui/logo-paths";
import { PAID_VIA, detailBlocks, formatMoney, invoiceDate, lineAmount, periodLabel, standingOf, sydneyDay } from "./invoice-rules";
import type { ClientInvoice, InvoiceIssuer, InvoiceWork } from "./types";

// The invoice as a PDF: A4, in the layout Craefto's invoices have had since
// INV-2026-009, set in the site's type (Archivo, DM Sans, Geist Mono). The
// same file is attached to the invoice email and downloaded from the portal
// and admin. Work delivered in the month before goes on its own page, as a
// record rather than a charge.

const INK = "#161615";
const BODY = "#3d3d39";
const MUTED = "#686862";
const RULE = "#e2e2dc";
const GREEN = "#4B6C59";
const WARM = "#F6EBDD";

let registered = false;
function registerFonts() {
  if (registered) return;
  // Bundled with the server function (next.config.ts, outputFileTracingIncludes).
  const file = (name: string) => join(process.cwd(), "src/lib/portal/invoice-fonts", name);
  Font.register({ family: "Archivo", fonts: [{ src: file("archivo-600.ttf"), fontWeight: 600 }] });
  Font.register({
    family: "DM Sans",
    fonts: [
      { src: file("dm-sans-400.ttf"), fontWeight: 400 },
      { src: file("dm-sans-500.ttf"), fontWeight: 500 },
      { src: file("dm-sans-700.ttf"), fontWeight: 700 },
    ],
  });
  Font.register({ family: "Geist Mono", fonts: [{ src: file("geist-mono-500.ttf"), fontWeight: 500 }] });
  // Whole words only: an invoice never breaks "maintenance" across lines.
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

const s = StyleSheet.create({
  page: { fontFamily: "DM Sans", fontSize: 9.5, color: INK, paddingTop: 44, paddingBottom: 70, paddingHorizontal: 48 },
  // The leading lives here, not on the page: a page-wide lineHeight throws the fixed footer off the page. Its
  // size is repeated so the leading is 1.45 of the body text (react-pdf resolves it against this element's size).
  body: { fontSize: 9.5, lineHeight: 1.45 },
  row: { flexDirection: "row" },
  between: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontFamily: "Geist Mono", fontWeight: 500, fontSize: 6.8, letterSpacing: 0.9, textTransform: "uppercase", color: MUTED, marginBottom: 6 },
  rule: { borderBottomWidth: 0.75, borderBottomColor: RULE, marginVertical: 16 },
  brand: { fontFamily: "Archivo", fontWeight: 600, fontSize: 15, letterSpacing: -0.2, lineHeight: 1.1 },
  brandSub: { fontSize: 7.8, color: MUTED, marginTop: 1 },
  title: { fontFamily: "Archivo", fontWeight: 600, fontSize: 20, letterSpacing: 2.6, textTransform: "uppercase", textAlign: "right", lineHeight: 1 },
  number: { fontSize: 9.5, color: MUTED, textAlign: "right", marginTop: 6 },
  stamp: { alignSelf: "flex-end", marginTop: 7, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999, fontFamily: "Geist Mono", fontWeight: 500, fontSize: 7, letterSpacing: 0.9, textTransform: "uppercase" },
  banner: { marginTop: 14, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: WARM, fontSize: 9 },
  party: { flex: 1, paddingRight: 14 },
  partyName: { fontWeight: 700, marginBottom: 1 },
  partyLine: { color: BODY },
  details: { width: 178 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3.5 },
  detailKey: { color: MUTED },
  dueRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, paddingTop: 7, borderTopWidth: 0.75, borderTopColor: RULE },
  th: { fontFamily: "Geist Mono", fontWeight: 500, fontSize: 6.8, letterSpacing: 0.9, textTransform: "uppercase", color: MUTED },
  thead: { flexDirection: "row", paddingBottom: 7, borderBottomWidth: 1, borderBottomColor: INK },
  item: { marginTop: 11 },
  itemTitle: { fontWeight: 700, fontSize: 10 },
  qty: { width: 46, textAlign: "right" },
  unit: { width: 78, textAlign: "right" },
  amount: { width: 84, textAlign: "right" },
  para: { color: BODY, marginTop: 5 },
  bullet: { flexDirection: "row", color: BODY, marginTop: 3, paddingLeft: 2 },
  bulletMark: { width: 11, color: MUTED },
  totals: { alignSelf: "flex-end", width: 210, marginTop: 18 },
  totalLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3.5, color: BODY },
  grand: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: INK },
  grandValue: { fontFamily: "Archivo", fontWeight: 600, fontSize: 15, lineHeight: 1 },
  lower: { flexDirection: "row", marginTop: 26 },
  payKey: { width: 82, color: MUTED },
  payValue: { fontWeight: 500 },
  note: { color: BODY, marginBottom: 5 },
  footer: { position: "absolute", left: 48, right: 48, bottom: 32, flexDirection: "row", justifyContent: "space-between", paddingTop: 8, borderTopWidth: 0.75, borderTopColor: RULE, fontSize: 7.8, color: MUTED },
  workTitle: { fontFamily: "Archivo", fontWeight: 600, fontSize: 15, letterSpacing: -0.2, marginTop: 2 },
  workIntro: { color: BODY, marginTop: 6, marginBottom: 10, maxWidth: 400 },
  workRow: { flexDirection: "row", paddingVertical: 4.5, borderBottomWidth: 0.5, borderBottomColor: RULE },
  workDate: { width: 56, fontFamily: "Geist Mono", fontWeight: 500, fontSize: 7.4, letterSpacing: 0.4, color: MUTED, paddingTop: 1.5 },
});

function Mark() {
  return (
    <Svg viewBox="0 0 400 400" style={{ width: 26, height: 26, marginRight: 9 }}>
      <G transform="translate(0,400) scale(0.1,-0.1)">
        <Path d={MARK_PATH} fill={INK} />
      </G>
    </Svg>
  );
}

function Detail({ detail }: { detail: string }) {
  return (
    <>
      {detailBlocks(detail).map((block, index) =>
        block.list ? (
          <View key={index} style={s.bullet} wrap={false}>
            <Text style={s.bulletMark}>•</Text>
            <Text style={{ flex: 1 }}>{block.text}</Text>
          </View>
        ) : (
          <Text key={index} style={s.para}>
            {block.text}
          </Text>
        )
      )}
    </>
  );
}

export interface InvoicePdf {
  invoice: ClientInvoice;
  /** The invoice's own issuer once issued; Craefto's details today on a draft. */
  issuer: InvoiceIssuer;
  /** The delivered work it lists (fixed on the invoice once issued). */
  work: InvoiceWork[];
  /** Where the client pays by card, if they can: "craefto.com/portal/billing". */
  payOnline: string | null;
  today: string;
}

function InvoiceDocument({ invoice, issuer, work, payOnline, today }: InvoicePdf) {
  const standing = standingOf(invoice, today);
  const title = issuer.gst_registered ? "Tax invoice" : "Invoice";
  const reference = invoice.number ?? "the invoice number";
  const showQuantity = invoice.items.some((item) => item.quantity !== 1);
  const due = standing === "paid" || standing === "void" ? 0 : invoice.total;
  const notes = [
    standing === "paid" ? null : `Please use ${reference} as the payment reference.`,
    standing === "paid" || !payOnline ? null : `To pay by card, open this invoice in your client portal: ${payOnline}.`,
    issuer.gst_registered ? null : `No GST charged: ${issuer.name} is not registered for GST.`,
    ...invoice.notes.split("\n").map((line) => line.trim()),
  ].filter(Boolean) as string[];

  return (
    <Document title={`${title} ${invoice.number ?? "(draft)"}`} author={issuer.name} subject={`${title} for ${invoice.bill_to_name}`} creator={issuer.name} producer={issuer.name}>
      <Page size="A4" style={s.page}>
        <View style={s.body}>
          <View style={[s.between, { alignItems: "flex-start" }]}>
            <View style={[s.row, { alignItems: "center" }]}>
              <Mark />
              <View>
                <Text style={s.brand}>{issuer.name}</Text>
                <Text style={s.brandSub}>Creative &amp; Technology Studio</Text>
              </View>
            </View>
            <View>
              <Text style={s.title}>{title}</Text>
              <Text style={s.number}>{invoice.number ?? "Draft"}</Text>
              {standing === "paid" && <Text style={[s.stamp, { backgroundColor: GREEN, color: "#FFFFFF" }]}>Paid</Text>}
              {standing === "void" && <Text style={[s.stamp, { backgroundColor: RULE, color: BODY }]}>Void</Text>}
            </View>
          </View>

          {standing === "draft" && <Text style={s.banner}>Draft: not issued yet, so not payable. Its number is given when it&apos;s issued.</Text>}
          {standing === "void" && (
            <Text style={s.banner}>Void: this invoice was cancelled{invoice.voided_at ? ` on ${invoiceDate(sydneyDay(invoice.voided_at))}` : ""} and isn&apos;t payable.</Text>
          )}

          <View style={s.rule} />

          <View style={s.row}>
            <View style={s.party}>
              <Text style={s.label}>From</Text>
              <Text style={s.partyName}>{issuer.name}</Text>
              {issuer.abn && <Text style={s.partyLine}>ABN {issuer.abn}</Text>}
              {issuer.address.map((line) => (
                <Text key={line} style={s.partyLine}>
                  {line}
                </Text>
              ))}
              <Text style={s.partyLine}>{issuer.email}</Text>
            </View>
            <View style={s.party}>
              <Text style={s.label}>Bill to</Text>
              <Text style={s.partyName}>{invoice.bill_to_name}</Text>
              {invoice.bill_to_address
                .split("\n")
                .filter(Boolean)
                .map((line) => (
                  <Text key={line} style={s.partyLine}>
                    {line}
                  </Text>
                ))}
            </View>
            <View style={s.details}>
              <Text style={s.label}>Invoice details</Text>
              <View style={s.detailRow}>
                <Text style={s.detailKey}>Issue date</Text>
                <Text>{invoiceDate(invoice.issue_date)}</Text>
              </View>
              <View style={s.detailRow}>
                <Text style={s.detailKey}>Due date</Text>
                <Text>{invoiceDate(invoice.due_date)}</Text>
              </View>
              {invoice.period_start && invoice.period_end && (
                <View style={s.detailRow}>
                  <Text style={s.detailKey}>Period</Text>
                  <Text>{periodLabel(invoice.period_start, invoice.period_end, true)}</Text>
                </View>
              )}
              {invoice.paid_at && (
                <View style={s.detailRow}>
                  <Text style={s.detailKey}>Paid</Text>
                  <Text>
                    {invoiceDate(sydneyDay(invoice.paid_at), true)}
                    {invoice.paid_via ? `, ${PAID_VIA[invoice.paid_via].toLowerCase()}` : ""}
                  </Text>
                </View>
              )}
              <View style={s.detailRow}>
                <Text style={s.detailKey}>Currency</Text>
                <Text>AUD</Text>
              </View>
              <View style={s.dueRow}>
                <Text style={{ fontWeight: 700 }}>Amount due</Text>
                <Text style={{ fontWeight: 700 }}>{formatMoney(due)}</Text>
              </View>
            </View>
          </View>

          <View style={s.rule} />

          <View style={s.thead}>
            <Text style={[s.th, { flex: 1 }]}>Description</Text>
            {showQuantity && <Text style={[s.th, s.qty]}>Qty</Text>}
            {showQuantity && <Text style={[s.th, s.unit]}>Unit price</Text>}
            <Text style={[s.th, s.amount]}>Amount</Text>
          </View>
          {invoice.items.map((item, index) => (
            <View key={index} style={s.item}>
              <View style={s.row} wrap={false}>
                <Text style={[s.itemTitle, { flex: 1, paddingRight: 12 }]}>{item.description}</Text>
                {showQuantity && <Text style={s.qty}>{item.quantity}</Text>}
                {showQuantity && <Text style={s.unit}>{formatMoney(item.unit_amount)}</Text>}
                <Text style={[s.itemTitle, s.amount]}>{formatMoney(lineAmount(item))}</Text>
              </View>
              {item.detail && (
                <View style={{ paddingRight: showQuantity ? 220 : 96 }}>
                  <Detail detail={item.detail} />
                </View>
              )}
            </View>
          ))}

          <View style={s.totals} wrap={false}>
            <View style={s.totalLine}>
              <Text>Subtotal</Text>
              <Text>{formatMoney(invoice.subtotal)}</Text>
            </View>
            <View style={s.totalLine}>
              <Text>{issuer.gst_registered ? "GST (10%)" : "GST"}</Text>
              <Text>{formatMoney(invoice.gst)}</Text>
            </View>
            <View style={s.grand}>
              <Text style={{ fontWeight: 700 }}>Total (AUD)</Text>
              <Text style={s.grandValue}>{formatMoney(invoice.total)}</Text>
            </View>
            {standing === "paid" && (
              <View style={[s.totalLine, { marginTop: 6, color: GREEN }]}>
                <Text>Paid {invoice.paid_at ? invoiceDate(sydneyDay(invoice.paid_at), true) : ""}</Text>
                <Text>{formatMoney(invoice.total)}</Text>
              </View>
            )}
          </View>

          <View style={s.lower} wrap={false}>
            <View style={{ flex: 1, paddingRight: 24 }}>
              <Text style={s.label}>Payment details</Text>
              {issuer.bank ? (
                [
                  ["Bank", issuer.bank.name],
                  ["Account name", issuer.bank.account_name],
                  ["BSB", issuer.bank.bsb],
                  ["Account", issuer.bank.account_number],
                  ["Reference", invoice.number ?? "Given when issued"],
                ]
                  .filter(([, value]) => value)
                  .map(([key, value]) => (
                    <View key={key} style={[s.row, { marginBottom: 3.5 }]}>
                      <Text style={s.payKey}>{key}</Text>
                      <Text style={s.payValue}>{value}</Text>
                    </View>
                  ))
              ) : (
                <Text style={s.note}>Bank details follow by email.</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Notes</Text>
              {notes.map((note, index) => (
                <Text key={index} style={s.note}>
                  {note}
                </Text>
              ))}
            </View>
          </View>

          {work.length > 0 && invoice.work_start && invoice.work_end && (
            <View break>
              <Text style={s.label}>Work delivered</Text>
              <Text style={s.workTitle}>{periodLabel(invoice.work_start, invoice.work_end)}</Text>
              <Text style={s.workIntro}>
                {work.length} {work.length === 1 ? "piece" : "pieces"} of work delivered in the month before this invoice&apos;s period: a record, not charged separately. Each is
                in your client portal under Past work, with what it changed and links to the work.
              </Text>
              {work.map((item) => (
                <View key={item.request_id} style={s.workRow} wrap={false}>
                  {/* The heading gives the year. */}
                  <Text style={s.workDate}>{invoiceDate(item.delivered_on, true).replace(/ \d{4}$/, "")}</Text>
                  <Text style={{ flex: 1 }}>{item.title}</Text>
                </View>
              ))}
            </View>
          )}

        </View>

        <View style={s.footer} fixed>
          <Text>
            {issuer.name}
            {issuer.abn ? ` · ABN ${issuer.abn}` : ""} · craefto.com · {issuer.email}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `${invoice.number ?? "Draft"} · Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

/** The invoice as PDF bytes. */
export async function renderInvoicePdf(data: InvoicePdf): Promise<Buffer> {
  registerFonts();
  return renderToBuffer(<InvoiceDocument {...data} />);
}
