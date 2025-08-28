import * as XLSX from 'xlsx';

// --- REVISI: Fungsi sekarang menerima 'exportConfig' ---
export const generatePerangkatXLSX = (groupedData, exportConfig) => {
    const wb = XLSX.utils.book_new(); // Membuat workbook baru

    // Loop untuk setiap grup data (setiap desa)
    groupedData.forEach((group, index) => {
        const desaName = group.desa.toUpperCase();
        const sheetName = `${index + 1}. ${desaName.substring(0, 25)}`; // Nama sheet, dipotong agar tidak terlalu panjang

        // --- 1. Menyiapkan Data untuk Sheet ---
        const dataForSheet = [];
        
        // Baris Judul Utama
        dataForSheet.push([`DATA PERANGKAT DESA ${desaName} (${String(index + 1).padStart(2, '0')}) KECAMATAN PUNGGELAN`]);
        dataForSheet.push([`TAHUN ${new Date().getFullYear()}`]);
        dataForSheet.push([]); // Baris kosong

        // Baris Header Kompleks
        const header1 = ["NO", "N A M A", "Jenis Kelamin", null, "JABATAN", "TEMPAT, TGL LAHIR", "PENDIDIKAN", null, null, null, null, null, null, "NO SK", "TANGGAL PELANTIKAN", "AKHIR MASA JABATAN", "No. HP / WA", "N I K"];
        const header2 = [null, null, "L", "P", null, null, "SD", "SMP", "SLTA", "D1-D3", "S1", "S2", "S3", null, null, null, null, null];
        dataForSheet.push(header1);
        dataForSheet.push(header2);

        // Baris Data Perangkat
        group.perangkat.forEach((p, i) => {
            const tglLahir = p.tgl_lahir ? new Date(p.tgl_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
            const tempatTglLahir = `${p.tempat_lahir || ''}, ${tglLahir}`;
            
            const tglLantik = p.tgl_pelantikan ? new Date(p.tgl_pelantikan).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
            const akhirJabatan = p.akhir_jabatan ? new Date(p.akhir_jabatan).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

            const row = [
                i + 1,
                p.nama || '',
                p.jenis_kelamin === 'L' ? 'V' : '',
                p.jenis_kelamin === 'P' ? 'V' : '',
                p.jabatan || '',
                tempatTglLahir,
                p.pendidikan === 'SD' ? 'V' : '',
                p.pendidikan === 'SMP' ? 'V' : '',
                p.pendidikan === 'SLTA' ? 'V' : '',
                ['D1', 'D2', 'D3'].includes(p.pendidikan) ? 'V' : '',
                p.pendidikan === 'S1' ? 'V' : '',
                p.pendidikan === 'S2' ? 'V' : '',
                p.pendidikan === 'S3' ? 'V' : '',
                p.no_sk || '',
                tglLantik,
                akhirJabatan,
                p.no_hp || '',
                p.nik || ''
            ];
            dataForSheet.push(row);
        });

        // --- FITUR BARU: Menambahkan Blok Tanda Tangan ---
        const signatureColIndex = 14; // Menempatkan tanda tangan di sekitar kolom O
        const getFormattedDate = () => new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        dataForSheet.push([]); // Baris kosong sebagai spasi
        dataForSheet.push([]); // Baris kosong sebagai spasi

        const dateRow = Array(signatureColIndex).fill(null);
        dateRow.push(`Punggelan, ${getFormattedDate()}`);
        dataForSheet.push(dateRow);

        const titleRow = Array(signatureColIndex).fill(null);
        titleRow.push(exportConfig?.jabatanPenandaTangan || 'Camat Punggelan');
        dataForSheet.push(titleRow);

        dataForSheet.push([]);
        dataForSheet.push([]);
        dataForSheet.push([]);

        const nameRow = Array(signatureColIndex).fill(null);
        nameRow.push(exportConfig?.namaPenandaTangan || 'NAMA CAMAT');
        dataForSheet.push(nameRow);

        const rankRow = Array(signatureColIndex).fill(null);
        rankRow.push(exportConfig?.pangkatPenandaTangan || 'Pangkat / Golongan');
        dataForSheet.push(rankRow);

        const nipRow = Array(signatureColIndex).fill(null);
        nipRow.push(exportConfig?.nipPenandaTangan || 'NIP. XXXXXX');
        dataForSheet.push(nipRow);


        // --- 2. Membuat Worksheet dari Data ---
        const ws = XLSX.utils.aoa_to_sheet(dataForSheet);

        // --- 3. Mengatur Penggabungan Sel (Merged Cells) ---
        ws['!merges'] = [
            // Judul
            { s: { r: 0, c: 0 }, e: { r: 0, c: 17 } }, 
            { s: { r: 1, c: 0 }, e: { r: 1, c: 17 } },
            // Header
            { s: { r: 3, c: 2 }, e: { r: 3, c: 3 } }, // Jenis Kelamin
            { s: { r: 3, c: 6 }, e: { r: 3, c: 12 } }, // PENDIDIKAN
            // Merge sel vertikal
            { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } }, // NO
            { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } }, // NAMA
            { s: { r: 3, c: 4 }, e: { r: 4, c: 4 } }, // JABATAN
            { s: { r: 3, c: 5 }, e: { r: 4, c: 5 } }, // TEMPAT, TGL LAHIR
            { s: { r: 3, c: 13 }, e: { r: 4, c: 13 } }, // NO SK
            { s: { r: 3, c: 14 }, e: { r: 4, c: 14 } }, // TANGGAL PELANTIKAN
            { s: { r: 3, c: 15 }, e: { r: 4, c: 15 } }, // AKHIR MASA JABATAN
            { s: { r: 3, c: 16 }, e: { r: 4, c: 16 } }, // No. HP
            { s: { r: 3, c: 17 }, e: { r: 4, c: 17 } }, // NIK
        ];
        
        // --- 4. Menambahkan Worksheet ke Workbook ---
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    // --- 5. Mengunduh File ---
    XLSX.writeFile(wb, 'Laporan_Perangkat_Desa.xlsx');
};
