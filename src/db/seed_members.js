import "dotenv/config";
import { db } from "./index.js";
import { members } from "./schema/members.js";
import { users } from "./schema/users.js";
import { jenisSimpanan, rekeningSimpanan } from "./schema/simpanan.js";
import { hashPassword } from "../utils/auth.js";
import { eq, inArray, sql } from "drizzle-orm";

// Daftar Nama Depan Pria
const FIRST_NAMES_MALE = [
  "Ahmad", "Bambang", "Budi", "Dedi", "Eko", "Fajar", "Gunawan", "Hendra", "Ilham", "Joko",
  "Kurniawan", "Lukman", "Muhammad", "Nur", "Pratama", "Raden", "Rizky", "Sigit", "Tri", "Wahyu",
  "Yusuf", "Agung", "Bayu", "Candra", "Dimas", "Firman", "Gilang", "Heru", "Indra", "Kusuma",
  "Muhamad", "Nugroho", "Oki", "Panji", "Rahmat", "Satria", "Teguh", "Untung", "Vicky", "Wawan",
  "Yoga", "Zainal", "Ade", "Bagus", "Danang", "Edi", "Faisal", "Guruh", "Hadi", "Irfan"
];

// Daftar Nama Depan Wanita
const FIRST_NAMES_FEMALE = [
  "Siti", "Sri", "Dewi", "Ani", "Putri", "Rina", "Maya", "Ratna", "Nurul", "Fitri",
  "Wulandari", "Endang", "Yuni", "Dian", "Kartika", "Nining", "Lestari", "Indah", "Mega", "Ratih",
  "Sari", "Tri", "Wahyuni", "Yuliana", "Zulfa", "Annisa", "Bella", "Citra", "Dini", "Eka",
  "Fadhilah", "Gita", "Hana", "Ika", "Juwita", "Kirana", "Lia", "Mira", "Nadia", "Olivia",
  "Puspa", "Qori", "Rahma", "Suci", "Tari", "Ulfa", "Vina", "Winda", "Yulia", "Zahra"
];

// Daftar Nama Belakang / Marga / Keluarga
const LAST_NAMES = [
  "Saputra", "Wijaya", "Hidayat", "Setiawan", "Nugroho", "Wibowo", "Pratama", "Santoso", "Siregar", "Nasution",
  "Lubis", "Pasaribu", "Hutapea", "Simanjuntak", "Subagyo", "Suryadi", "Purnomo", "Kusuma", "Utomo", "Wardhana",
  "Kurniawan", "Prasetyo", "Firmansyah", "Ramadhan", "Gunawan", "Syahputra", "Permana", "Mahendra", "Wicaksono", "Suharto",
  "Mustofa", "Hakim", "Fauzi", "Supriyadi", "Sanjaya", "Hartono", "Susanto", "Irawan", "Pradipta", "Adiputra",
  "Budiman", "Cahyono", "Darman", "Effendi", "Fahrudin", "Ginanjar", "Handoko", "Iskandar", "Junaedi", "Kosasih"
];

// Kota / Tempat Lahir & Kode Wilayah KTP (Provinsi + Kab/Kota)
const REGIONS = [
  { code: "3201", kota: "Bogor" },
  { code: "3271", kota: "Kota Bogor" },
  { code: "3171", kota: "Jakarta Pusat" },
  { code: "3174", kota: "Jakarta Selatan" },
  { code: "3175", kota: "Jakarta Timur" },
  { code: "3273", kota: "Bandung" },
  { code: "3276", kota: "Depok" },
  { code: "3275", kota: "Bekasi" },
  { code: "3674", kota: "Tangerang Selatan" },
  { code: "3671", kota: "Tangerang" },
  { code: "3203", kota: "Cianjur" },
  { code: "3202", kota: "Sukabumi" },
  { code: "3209", kota: "Cirebon" },
  { code: "3374", kota: "Semarang" },
  { code: "3372", kota: "Surakarta" },
  { code: "3471", kota: "Yogyakarta" },
  { code: "3578", kota: "Surabaya" },
  { code: "3573", kota: "Malang" },
];

// Pekerjaan
const OCCUPATIONS = [
  "Wiraswasta",
  "Karyawan Swasta",
  "Pegawai Negeri Sipil (PNS)",
  "Guru / Pendidik",
  "Pedagang Sembako",
  "Petani Modern",
  "Tenaga Medis / Bidan",
  "Pengemudi Online",
  "Karyawan BUMN",
  "Mekanik Otomotif",
  "Penjahit / Konveksi",
  "Pengusaha Kuliner",
  "Teknisi Elektronik",
  "Akuntan",
  "Dosen",
  "Pensiunan ASN",
  "Buruh Bangunan Berpengalaman",
  "Peternak Unggas",
];

// Nama Jalan
const STREET_NAMES = [
  "Jl. Merdeka", "Jl. Raya Pajajaran", "Jl. Sudirman", "Jl. Diponegoro", "Jl. Gatot Subroto",
  "Jl. Ahmad Yani", "Jl. Surya Kencana", "Jl. Asia Afrika", "Jl. Dago", "Jl. Setiabudi",
  "Jl. Juanda", "Jl. Siliwangi", "Jl. Pahlawan", "Jl. Veteran", "Jl. Pemuda",
  "Jl. Kebon Pedes", "Jl. Ciomas Raya", "Jl. Kedung Halang", "Jl. Tajur Raya", "Jl. Cimanggu Barata"
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function seed500Members() {
  console.log("=================================================");
  console.log("🚀 MEMULAI SEEDER 500 DATA ANGGOTA KOPERASI...");
  console.log("=================================================");

  const startTime = Date.now();

  try {
    // 1. Ambil Jenis Simpanan yang aktif untuk pembuatan rekening
    const masterSimpanan = await db.select().from(jenisSimpanan).where(eq(jenisSimpanan.is_active, true));
    const spJenis = masterSimpanan.find((j) => j.kode === "SP");
    const swJenis = masterSimpanan.find((j) => j.kode === "SW");
    const ssJenis = masterSimpanan.find((j) => j.kode === "SS");

    console.log(`📋 Master simpanan ditemukan: ${masterSimpanan.length} jenis.`);

    // 2. Hash password sekali saja untuk akun member (kinerja cepat)
    console.log("🔑 Menyiapkan password hash default ('member123')...");
    const defaultPasswordHash = await hashPassword("member123");

    // 3. Siapkan 500 data
    const TOTAL_MEMBERS = 500;
    const USERS_WITH_LOGIN_RATIO = 0.6; // 60% sudah punya akun login, 40% belum aktivasi (user_id null)
    
    const usedNiks = new Set();
    const usedPhones = new Set();
    const usedUsernames = new Set();
    const usedNoAnggota = new Set();

    const userDataList = [];
    const memberDataList = [];

    // Prefix untuk nomor anggota seeder agar terstruktur rapi
    const YEAR = new Date().getFullYear();
    const BASE_START_INDEX = 1001;

    for (let i = 0; i < TOTAL_MEMBERS; i++) {
      const isMale = Math.random() < 0.52; // 52% pria, 48% wanita
      const gender = isMale ? "L" : "P";
      const firstName = isMale ? pickRandom(FIRST_NAMES_MALE) : pickRandom(FIRST_NAMES_FEMALE);
      const lastName = pickRandom(LAST_NAMES);
      const fullName = `${firstName} ${lastName}`;

      // No Anggota: KOP-{YEAR}-{INDEX}
      const memberNumber = `KOP-${YEAR}-${String(BASE_START_INDEX + i).padStart(4, "0")}`;
      usedNoAnggota.add(memberNumber);

      // Tanggal Lahir (usia antara 21 s.d 60 tahun)
      const birthYear = getRandomInt(1966, 2005);
      const birthMonth = getRandomInt(1, 12);
      const birthDay = getRandomInt(1, 28);
      const birthDateStr = `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`;

      // Region & NIK generator sesuai standar Dukcapil
      // Format NIK: [Kode Wilayah 4 digit][Kecamatan 2 digit][Tanggal Lahir 6 digit][Urut 4 digit]
      // Wanita: tanggal lahir + 40
      const region = pickRandom(REGIONS);
      const subDistrictCode = String(getRandomInt(1, 15)).padStart(2, "0");
      const nikDay = isMale ? birthDay : birthDay + 40;
      const nikDatePart = `${String(nikDay).padStart(2, "0")}${String(birthMonth).padStart(2, "0")}${String(birthYear).slice(-2)}`;
      
      let nikSeq = 1;
      let nik = "";
      do {
        nik = `${region.code}${subDistrictCode}${nikDatePart}${String(nikSeq).padStart(4, "0")}`;
        nikSeq++;
      } while (usedNiks.has(nik));
      usedNiks.add(nik);

      // Nomor Handphone Unik (Format Indonesia)
      const phonePrefixes = ["0812", "0813", "0821", "0822", "0852", "0857", "0878", "0896"];
      const prefix = phonePrefixes[i % phonePrefixes.length];
      const phoneSuffix = String(10000000 + i).slice(1);
      const phone = `${prefix}${phoneSuffix}`;
      usedPhones.add(phone);

      // Alamat
      const street = pickRandom(STREET_NAMES);
      const houseNumber = getRandomInt(1, 199);
      const rt = String(getRandomInt(1, 12)).padStart(2, "0");
      const rw = String(getRandomInt(1, 10)).padStart(2, "0");
      const address = `${street} No. ${houseNumber}, RT ${rt}/RW ${rw}, ${region.kota}`;

      // Pekerjaan
      const occupation = pickRandom(OCCUPATIONS);

      // Status Keanggotaan: 88% active, 5% pending, 5% inactive, 2% suspended
      let status = "active";
      const statusRand = Math.random();
      if (statusRand > 0.98) status = "suspended";
      else if (statusRand > 0.93) status = "inactive";
      else if (statusRand > 0.88) status = "pending";

      // Tanggal Bergabung (antara 2021 hingga sekarang)
      const joinDaysAgo = getRandomInt(5, 1800);
      const joinDate = new Date(Date.now() - joinDaysAgo * 24 * 60 * 60 * 1000);

      // Tentukan apakah punya akun login pengguna
      const hasUserAccount = i < TOTAL_MEMBERS * USERS_WITH_LOGIN_RATIO && status === "active";
      let username = null;
      let email = null;

      if (hasUserAccount) {
        let baseUsername = `${firstName.toLowerCase()}_${lastName.toLowerCase()}`.replace(/[^a-z0-9]/g, "");
        username = `${baseUsername}_${i + 1}`;
        email = `${baseUsername}${i + 1}@koperasi.id`;
        usedUsernames.add(username);

        userDataList.push({
          index: i,
          username,
          phone,
          email,
          password_hash: defaultPasswordHash,
          role: "member",
          is_active: true,
        });
      }

      memberDataList.push({
        index: i,
        no_anggota: memberNumber,
        nik,
        nama_lengkap: fullName,
        tempat_lahir: region.kota,
        tanggal_lahir: birthDateStr,
        jenis_kelamin: gender,
        no_hp: phone,
        alamat: address,
        pekerjaan: occupation,
        status_keanggotaan: status,
        tanggal_bergabung: joinDate,
        is_verified: status === "active" || status === "inactive",
        hasUserAccount,
      });
    }

    // 4. Batch Insert Users
    console.log(`📦 Memasukkan ${userDataList.length} data akun login user...`);
    const userIndexToIdMap = new Map();

    const USER_BATCH_SIZE = 100;
    for (let u = 0; u < userDataList.length; u += USER_BATCH_SIZE) {
      const chunk = userDataList.slice(u, u + USER_BATCH_SIZE).map(({ index, ...data }) => data);
      const insertedUsers = await db.insert(users).values(chunk).returning({ id: users.id, username: users.username, phone: users.phone });
      
      insertedUsers.forEach((user, idx) => {
        const originalItem = userDataList[u + idx];
        userIndexToIdMap.set(originalItem.index, user.id);
      });
    }
    console.log(`✅ ${userDataList.length} akun login user berhasil disimpan.`);

    // 5. Batch Insert Members
    console.log(`📦 Memasukkan ${TOTAL_MEMBERS} data anggota (members)...`);
    const createdMembers = [];
    const MEMBER_BATCH_SIZE = 100;

    for (let m = 0; m < memberDataList.length; m += MEMBER_BATCH_SIZE) {
      const chunk = memberDataList.slice(m, m + MEMBER_BATCH_SIZE).map((item) => ({
        user_id: item.hasUserAccount ? userIndexToIdMap.get(item.index) : null,
        no_anggota: item.no_anggota,
        nik: item.nik,
        nama_lengkap: item.nama_lengkap,
        tempat_lahir: item.tempat_lahir,
        tanggal_lahir: item.tanggal_lahir,
        jenis_kelamin: item.jenis_kelamin,
        no_hp: item.no_hp,
        alamat: item.alamat,
        pekerjaan: item.pekerjaan,
        status_keanggotaan: item.status_keanggotaan,
        tanggal_bergabung: item.tanggal_bergabung,
        is_verified: item.is_verified,
      }));

      const inserted = await db.insert(members).values(chunk).returning({
        id: members.id,
        no_anggota: members.no_anggota,
        status_keanggotaan: members.status_keanggotaan,
        nama_lengkap: members.nama_lengkap,
      });

      createdMembers.push(...inserted);
    }
    console.log(`✅ ${createdMembers.length} anggota berhasil disimpan.`);

    // 6. Buat Rekening Simpanan Pokok & Wajib otomatis untuk anggota berstatus "active"
    if (spJenis && swJenis) {
      console.log("💳 Membuat rekening simpanan (Pokok & Wajib) untuk anggota aktif...");
      const rekeningDataList = [];

      let rekCounter = 1000;
      for (const m of createdMembers) {
        if (m.status_keanggotaan === "active") {
          rekCounter++;
          // Simpanan Pokok (Setoran wajib sekali, Rp 100.000)
          rekeningDataList.push({
            member_id: m.id,
            jenis_simpanan_id: spJenis.id,
            nomor_rekening: `SP-${YEAR}-${String(rekCounter).padStart(5, "0")}`,
            saldo: "100000.00",
            status: "aktif",
          });

          // Simpanan Wajib (Akumulasi simpanan bulanan Rp 100.000 - Rp 2.500.000)
          const swMonths = getRandomInt(4, 36);
          const swSaldo = (swMonths * 25000).toFixed(2);
          rekeningDataList.push({
            member_id: m.id,
            jenis_simpanan_id: swJenis.id,
            nomor_rekening: `SW-${YEAR}-${String(rekCounter).padStart(5, "0")}`,
            saldo: swSaldo,
            status: "aktif",
          });

          // 40% anggota aktif juga punya rekening Simpanan Sukarela
          if (ssJenis && Math.random() < 0.4) {
            const ssSaldo = (getRandomInt(10, 200) * 10000).toFixed(2);
            rekeningDataList.push({
              member_id: m.id,
              jenis_simpanan_id: ssJenis.id,
              nomor_rekening: `SS-${YEAR}-${String(rekCounter).padStart(5, "0")}`,
              saldo: ssSaldo,
              status: "aktif",
            });
          }
        }
      }

      console.log(`📦 Memasukkan ${rekeningDataList.length} rekening simpanan...`);
      const REK_BATCH_SIZE = 100;
      for (let r = 0; r < rekeningDataList.length; r += REK_BATCH_SIZE) {
        const chunk = rekeningDataList.slice(r, r + REK_BATCH_SIZE);
        await db.insert(rekeningSimpanan).values(chunk);
      }
      console.log(`✅ ${rekeningDataList.length} rekening simpanan berhasil dibuat.`);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n=================================================");
    console.log(`🎉 SEEDING SELESAI DALAM ${elapsed} DETIK!`);
    console.log("=================================================");
    console.log(`📊 Total Anggota Dibuat     : ${createdMembers.length}`);
    console.log(`👤 Akun Login Aktif Dibuat  : ${userDataList.length} (Password: member123)`);
    console.log(`📱 Anggota Siap Aktivasi/OTP: ${TOTAL_MEMBERS - userDataList.length}`);
    console.log(`🆔 Range Nomor Anggota      : KOP-${YEAR}-${BASE_START_INDEX} s/d KOP-${YEAR}-${BASE_START_INDEX + TOTAL_MEMBERS - 1}`);
    console.log("=================================================\n");

    return {
      success: true,
      totalMembers: createdMembers.length,
      totalUsers: userDataList.length,
    };
  } catch (error) {
    console.error("❌ Terjadi kesalahan saat seeding anggota:", error);
    throw error;
  }
}

// Eksekusi seeder
seed500Members()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Gagal seeding 500 members:", err);
    process.exit(1);
  });
