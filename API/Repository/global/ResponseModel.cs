
#region Common *************************************************
public class ResponseData<T>
{   public bool success { get; set; }
    public string message { get; set; }
    public T data { get; set; }
}

public class PagedResponse<T>
{
    public bool success { get; set; }
    public string message { get; set; } = "";
    public List<T> data { get; set; } = new List<T>();
    public int pageNumber { get; set; }
    public int pageSize { get; set; }
    public int totalRecords { get; set; }
    public int totalPages { get; set; }
}

#endregion Common


#region LOGIN *************************************************
public class ResponseLogin
{
    public string Userid { get; set; }
    public string Userpt { get; set; }
    public string Username { get; set; }
    public string Password { get; set; }
    public string Userlvl { get; set; }
    public bool GantiKunci { get; set; }
    public bool Supportprice { get; set; }

}

public class ResponsePt
{
    public string PtCode { get; set; }
    public string PtName { get; set; }
    public string TahunAktifInv { get; set; }
    public string TahunAktifGl { get; set; }
}

#endregion LOGIN

#region Master *************************************************
public class ResponseModelItemMaster
{
    public string code { get; set; } 
    public string name { get; set; }
    public string img1 { get; set; }
    public string classcode { get; set; }
    public string classname { get; set; }
    public string baseunitcode { get; set; }
    public string baseunitname { get; set; }
    public DateTime? activedate { get; set; }
    public long iditem { get; set; }
}

public class ResponseModeMasterDonatur
{
    public long id_donatur { get; set; }
    public string Nama { get; set; } = "";
    public DateTime? TglLahir { get; set; }
    public DateTime? CreatedDate { get; set; }
    public string NoHP { get; set; } = "";
    public bool Status { get; set; }
    public DateTime? LastDonation { get; set; }
}

public class ResponseModelMasterPendoa
{
    public long id_pendoa { get; set; }
    public string nama { get; set; } = "";
    public DateTime createddate { get; set; }
    public string nohp { get; set; } = "";
    public bool dfl { get; set; }
}

public class ResponseModelMasterUser
{
    public string pt { get; set; } = "";
    public string userid { get; set; } = "";
    public string nama { get; set; } = "";
    public byte lvl { get; set; }
    public string kunci { get; set; } = "";
    public bool gantiKunci { get; set; }
}

public class ResponseModelDashboardBirthday
{
    public long id_donatur { get; set; }
    public string nama { get; set; } = "";
    public DateTime? tglLahir { get; set; }
    public DateTime? birthdayDate { get; set; }
    public string noHP { get; set; } = "";
    public bool status { get; set; }
    public DateTime? lastDonation { get; set; }
    public bool sudahDidoakan { get; set; }
    public bool sudahAdaPesanDoa { get; set; }
    public bool sudahAdaPesanSuara { get; set; }
    public long? id_TRBirthdayPray { get; set; }
    public DateTime? prayCreatedDate { get; set; }
}

public class ResponseModelTRBirthdayPray
{
    public long id_TRBirthdayPray { get; set; }
    public long id_donatur { get; set; }
    public long id_pendoa { get; set; }
    public string namaDonatur { get; set; } = "";
    public DateTime? tglLahir { get; set; }
    public DateTime? birthdayDate { get; set; }
    public string noHPDonatur { get; set; } = "";
    public string namaPendoa { get; set; } = "";
    public string noHPPendoa { get; set; } = "";
    public string pesan { get; set; } = "";
    public string pathPesanSuara { get; set; } = "";
    public DateTime? createdDate { get; set; }
}

public class ResponseModelTRBirthdayPrayHistory
{
    public long id_TRBirthdayPray { get; set; }
    public long id_pendoa { get; set; }
    public string namaDonatur { get; set; } = "";
    public string namaPendoa { get; set; } = "";
    public DateTime? birthdayDate { get; set; }
    public string pesan { get; set; } = "";
    public string pathPesanSuara { get; set; } = "";
    public DateTime? createdDate { get; set; }
}

#endregion Master

#region Report BC *************************************************

public class ResponseModelListBC
{
    public int No{ get; set; }
    public string TipeBC{ get; set; }
    public string NoBC { get; set; }
    public  DateTime TglBC { get; set; }
    public string TRNo { get; set; }
    public DateTime TRDate { get; set; }
    public string InvNo { get; set; }
    public DateTime InvDate { get; set; }
    public string SuppName { get; set; }
    public string ItemCode{ get; set; }
    public string ItemName { get; set; }
    public string Alias { get; set; }
    public string UnitName { get; set; }
    public decimal Qty{ get; set; }
    public decimal Price{ get; set; }
    public decimal Amt { get; set; }
    public string CurrCode { get; set; }
    public string HSNO{ get; set; }
}

public class ResponseModelPosisisWIP
{
    public int No { get; set; }
    public string ItemCode { get; set; }
    public string ItemName { get; set; }
    public decimal Qty { get; set; }
    public string UnitName { get; set; }
}

public class ResponseModelMutStok
{
    public int no { get; set; }
    public string ItemCode { get; set; }
    public string ItemName { get; set; }
    public string UnitName { get; set; }
    public decimal Beginning { get; set; }
    public decimal IN { get; set; }
    public decimal OUT { get; set; }
    public decimal Saldo { get; set; }
    public decimal QtyOpname { get; set; }
    public decimal DifOpname { get; set; }
}

public class ResponseModelHistLog
{
    public int Urut { get; set; }
    public string UserID { get; set; }
    public string JenisTR { get; set; }
    public string NoTR { get; set; }
    public string Act { get; set; }
    public string Waktu { get; set; }
    public string Ket { get; set; }

}


#endregion Report BC
