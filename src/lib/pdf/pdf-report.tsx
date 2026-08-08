import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

interface IMedicinePdf {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

interface MedicalReportPdfProps {
  hospitalInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  patientInfo: {
    name: string;
    email: string;
    recordNo: string;
  };
  doctorInfo: {
    name: string;
    specialization: string;
    strNumber?: string;
  };
  consultationInfo: {
    date: string;
    appointmentId: string;
    chiefComplaint: string;
    diagnosis: string;
    notes?: string;
    vitalSigns?: {
      bloodPressure?: string;
      temperature?: number;
      heartRate?: number;
    };
  };
  prescription?: {
    medicines: IMedicinePdf[];
    generalNotes?: string;
  } | null;
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },
  kopContainer: {
    borderBottomWidth: 2,
    borderBottomColor: "#0d9488", // teal-600
    pb: 10,
    mb: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kopTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f766e", // teal-700
  },
  kopSubtitle: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
  },
  docTitleBadge: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f766e",
    textAlign: "center",
    backgroundColor: "#ccfbf1", // teal-100
    paddingVertical: 5,
    borderRadius: 4,
    marginBottom: 15,
  },
  twoColumnGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  columnCard: {
    width: "48%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 8,
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f766e",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 3,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    width: "40%",
    color: "#475569",
    fontWeight: "bold",
  },
  infoValue: {
    width: "60%",
    color: "#0f172a",
  },
  sectionContainer: {
    marginBottom: 15,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f766e",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#0d9488",
    paddingBottom: 4,
  },
  textBody: {
    fontSize: 10,
    lineHeight: 1.4,
    color: "#334155",
  },
  vitalsGrid: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    padding: 6,
    marginTop: 6,
  },
  vitalItem: {
    flex: 1,
    alignItems: "center",
  },
  vitalLabel: {
    fontSize: 8,
    color: "#64748b",
  },
  vitalValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f766e",
    marginTop: 2,
  },

  // Prescription Table
  table: {
    width: "100%",
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0d9488",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  colNo: { width: "8%", textAlign: "center" },
  colName: { width: "32%" },
  colDosage: { width: "20%" },
  colFreq: { width: "25%" },
  colNotes: { width: "15%" },

  footerContainer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  signatureBox: {
    width: "40%",
    alignItems: "center",
  },
  signatureSpace: {
    height: 40,
  },
  disclaimerText: {
    fontSize: 7,
    color: "#94a3b8",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 15,
  },
});

export function MedicalReportPdfDocument({
  hospitalInfo,
  patientInfo,
  doctorInfo,
  consultationInfo,
  prescription,
}: MedicalReportPdfProps) {
  return (
    <Document title={`Laporan Rekam Medis - ${patientInfo.name}`}>
      <Page size="A4" style={styles.page}>
        {/* Kop Surat RS TeleMedika */}
        <View style={styles.kopContainer}>
          <View>
            <Text style={styles.kopTitle}>{hospitalInfo.name}</Text>
            <Text style={styles.kopSubtitle}>{hospitalInfo.address}</Text>
            <Text style={styles.kopSubtitle}>
              Telp: {hospitalInfo.phone} | Email: {hospitalInfo.email}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 9, color: "#64748b" }}>DOKUMEN RESMI TELEMEDIS</Text>
            <Text style={{ fontSize: 8, color: "#94a3b8", marginTop: 2 }}>
              ID: {consultationInfo.appointmentId.slice(-8).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Title Badge */}
        <View>
          <Text style={styles.docTitleBadge}>LAPORAN REKAM MEDIS & RESEP DIGITAL</Text>
        </View>

        {/* Info Grid Pasien & Dokter */}
        <View style={styles.twoColumnGrid}>
          {/* Patient Card */}
          <View style={styles.columnCard}>
            <Text style={styles.cardHeader}>DATA PASIEN</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama</Text>
              <Text style={styles.infoValue}>: {patientInfo.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>No. RM</Text>
              <Text style={styles.infoValue}>: {patientInfo.recordNo}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>: {patientInfo.email}</Text>
            </View>
          </View>

          {/* Doctor Card */}
          <View style={styles.columnCard}>
            <Text style={styles.cardHeader}>DOKTER PENANGGUNG JAWAB</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama Dokter</Text>
              <Text style={styles.infoValue}>: {doctorInfo.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Spesialisasi</Text>
              <Text style={styles.infoValue}>: {doctorInfo.specialization}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tgl Konsultasi</Text>
              <Text style={styles.infoValue}>: {consultationInfo.date}</Text>
            </View>
          </View>
        </View>

        {/* Clinical Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>1. RINGKASAN KLINIS & DIAGNOSIS MEDIS</Text>
          
          <View style={{ marginBottom: 6 }}>
            <Text style={{ fontWeight: "bold", color: "#475569", marginBottom: 2 }}>Keluhan Utama Pasien:</Text>
            <Text style={styles.textBody}>{consultationInfo.chiefComplaint}</Text>
          </View>

          {/* Vital Signs if available */}
          {consultationInfo.vitalSigns && (
            <View style={styles.vitalsGrid}>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>Tekanan Darah</Text>
                <Text style={styles.vitalValue}>
                  {consultationInfo.vitalSigns.bloodPressure || "-"}
                </Text>
              </View>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>Suhu Tubuh</Text>
                <Text style={styles.vitalValue}>
                  {consultationInfo.vitalSigns.temperature ? `${consultationInfo.vitalSigns.temperature} °C` : "-"}
                </Text>
              </View>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>Denyut Nadi</Text>
                <Text style={styles.vitalValue}>
                  {consultationInfo.vitalSigns.heartRate ? `${consultationInfo.vitalSigns.heartRate} bpm` : "-"}
                </Text>
              </View>
            </View>
          )}

          <View style={{ marginTop: 8 }}>
            <Text style={{ fontWeight: "bold", color: "#0f766e", marginBottom: 2 }}>Diagnosis Medis Resmi:</Text>
            <Text style={[styles.textBody, { fontWeight: "bold" }]}>{consultationInfo.diagnosis}</Text>
          </View>

          {consultationInfo.notes && (
            <View style={{ marginTop: 6 }}>
              <Text style={{ fontWeight: "bold", color: "#475569", marginBottom: 2 }}>Catatan & Instruksi Dokter:</Text>
              <Text style={styles.textBody}>{consultationInfo.notes}</Text>
            </View>
          )}
        </View>

        {/* Prescription Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>2. RESEP OBAT DIGITAL (E-PRESCRIPTION)</Text>
          
          {prescription && prescription.medicines.length > 0 ? (
            <View>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, styles.colNo]}>NO</Text>
                  <Text style={[styles.tableHeaderCell, styles.colName]}>NAMA OBAT</Text>
                  <Text style={[styles.tableHeaderCell, styles.colDosage]}>DOSIS</Text>
                  <Text style={[styles.tableHeaderCell, styles.colFreq]}>ATURAN & DURASI</Text>
                  <Text style={[styles.tableHeaderCell, styles.colNotes]}>CATATAN</Text>
                </View>

                {prescription.medicines.map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={styles.colNo}>{index + 1}</Text>
                    <Text style={[styles.colName, { fontWeight: "bold" }]}>{item.name}</Text>
                    <Text style={styles.colDosage}>{item.dosage}</Text>
                    <Text style={styles.colFreq}>
                      {item.frequency} ({item.duration})
                    </Text>
                    <Text style={styles.colNotes}>{item.notes || "-"}</Text>
                  </View>
                ))}
              </View>

              {prescription.generalNotes && (
                <View style={{ marginTop: 6 }}>
                  <Text style={{ fontSize: 8, color: "#475569", fontStyle: "italic" }}>
                    Catatan Umum Tebus Obat: {prescription.generalNotes}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={{ fontSize: 9, color: "#64748b", fontStyle: "italic" }}>
              Tidak ada resep obat tertulis untuk rekam medis ini.
            </Text>
          )}
        </View>

        {/* Footer & Doctor Signature Box */}
        <View style={styles.footerContainer}>
          <View style={{ width: "50%" }}>
            <Text style={{ fontSize: 8, color: "#64748b" }}>
              Dokumen ini diterbitkan secara sah melalui Sistem Telemedicine RS TeleMedika.
            </Text>
          </View>

          <View style={styles.signatureBox}>
            <Text style={{ fontSize: 9, color: "#64748b" }}>Dokter Penanggung Jawab,</Text>
            <View style={styles.signatureSpace} />
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0f766e" }}>{doctorInfo.name}</Text>
            <Text style={{ fontSize: 8, color: "#64748b" }}>Spesialisasi: {doctorInfo.specialization}</Text>
          </View>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimerText}>
          Dokumen rekam medis ini bersifat rahasia dan dilindungi oleh undang-undang privasi kesehatan. Hanya pasien yang berhak dan dokter pemeriksa yang berwenang untuk mengakses dokumen ini.
        </Text>
      </Page>
    </Document>
  );
}
