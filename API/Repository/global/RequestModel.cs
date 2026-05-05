using Swashbuckle.AspNetCore.Annotations;
using System.ComponentModel;

#region Common  *************************************************
public class PaginationRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Search { get; set; }
}

public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = new List<T>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

#endregion

#region Master *************************************************
public class RequestCreateMasterPendoa
{
    public string nama { get; set; }
    public bool dfl { get; set; }
    public string nohp { get; set; }
}

public class RequestCreateMasterDonatur
{
    public string nama { get; set; }
    public DateTime? tglLahir { get; set; }
    public string nohp { get; set; }
    public bool status { get; set; }
    public DateTime? lastDonation { get; set; }
}

public class RequestUpdateMasterDonatur
{
    public long idDonatur { get; set; }
    public string nama { get; set; }
    public DateTime? tglLahir { get; set; }
    public string nohp { get; set; }
    public bool status { get; set; }
    public DateTime? lastDonation { get; set; }
}

public class RequestUpdateMasterPendoa
{
    public string nama { get; set; }
    public bool dfl { get; set; }
    public string nohp { get; set; }
    public long idpendoa { get; set; }
}

public class RequestCreateMasterUser
{
    public string? pt { get; set; }
    public string? userid { get; set; }
    public string? nama { get; set; }
    public byte? lvl { get; set; }
    public string? kunci { get; set; }
    public bool gantiKunci { get; set; }
    public string? permissionsJson { get; set; }
}

public class RequestUpdateMasterUser
{
    public string? pt { get; set; }
    public string? userid { get; set; }
    public string? nama { get; set; }
    public byte? lvl { get; set; }
    public string? kunci { get; set; }
    public bool gantiKunci { get; set; }
    public string? permissionsJson { get; set; }
}

public class RequestMasterUserPermissionItem
{
    public long id_form { get; set; }
    public bool canView { get; set; }
    public bool canAdd { get; set; }
    public bool canEdit { get; set; }
    public bool canPrint { get; set; }
    public bool canDelete { get; set; }
}

public class RequestGetAllMasterUser
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 15;
    public string Search { get; set; } = "";
}

public class RequestChangePassword
{
    public string? pt { get; set; }
    public string? userid { get; set; }
    public string? currentPassword { get; set; }
    public string? newPassword { get; set; }
}

public class RequestCreateMasterItem
{
    public string code { get; set; }
    public string name { get; set; }
    public string classcode { get; set; }
    public string img1 { get; set; }
    public string usercreate { get; set; }

}

public class RequestUpdateMasterItem
{
    public long iditem { get; set; }
    public string code { get; set; }
    public string name { get; set; }
    public string classcode { get; set; }
    public string baseunitcode { get; set; }
    public string? img1 { get; set; }
    public DateTime activedate { get; set; }
    public string userupdate { get; set; }
    public IFormFile? img1File { get; set; }
}
public class RequestGetAllItemMaster
{
    public string Area { get; set; } = "";
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string Search { get; set; } = "";
}

public class RequestGetAllMasterPendoa
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string Search { get; set; } = "";
}

public class RequestGetAllMasterDonatur
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string Search { get; set; } = "";
}

public class RequestSaveTRBirthdayPray
{
    public long idDonatur { get; set; }
    public long? idTRBirthdayPray { get; set; }
    public string? pesan { get; set; }
    public IFormFile? pesanSuaraFile { get; set; }
    public bool saveToAllSameBirthdayDate { get; set; } = true;
}

public class RequestSaveTRBirthdayPrayVoice
{
    public long idDonatur { get; set; }
    public long? idTRBirthdayPray { get; set; }
    public IFormFile? pesanSuaraFile { get; set; }
    public bool saveToAllSameBirthdayDate { get; set; } = true;
}

public class RequestSaveTRBuletin
{
    public long? id_buletin { get; set; }
    public string? description { get; set; }
    public string? pesanText { get; set; }
    public string? existingPathFile { get; set; }
    public IFormFile? attachmentFile { get; set; }
}

public class RequestDeleteTRBuletin
{
    public long id_buletin { get; set; }
}

public class RequestPublishTRBuletin
{
    public long id_buletin { get; set; }
}

public class RequestUpdateWhatsAppSchedule
{
    public string? sendTime { get; set; }
    public bool isActive { get; set; }
}

public class RequestUpdateApplicationSetting
{
    public string? msgTemplate { get; set; }
    public string? msgLink { get; set; }
    public string? existingMsgImage { get; set; }
    public IFormFile? msgImageFile { get; set; }
    public string? whatsappTemplateName { get; set; }
}

public class RequestSendWhatsApp
{
    public long idDonatur { get; set; }
    public int? year { get; set; }
}

# endregion

#region LOGIN *************************************************

public class RequestLogin
{
    public string Userid { get; set; }
    public string Password { get; set; }
    
    [DefaultValue("GKY")]
    public string Userpt { get; set; }

}
public class RequestLog
{
    public string Userid { get; set; }
    public string Jenistr { get; set; }
    public string Notr { get; set; }
    public string FromModul { get; set; }
    public string Act { get; set; }
    public string Ket { get; set; }
    public string Kodearea { get; set; }
}

#endregion LOGIN

#region Report BC *************************************************

public class RequestModelListBC
    {
        public DateTime datefrom { get; set; } 
        public DateTime dateto { get; set; }
        [DefaultValue("")]
        public string typebcfrom { get; set; }
        [DefaultValue("")]
        public string typebcto { get; set; }
        [DefaultValue("")]
        public string itemfrom { get; set; }
        [DefaultValue("")]
        public string itemto { get; set; }

        [DefaultValue(1)]
        public int intr { get; set; }

        [DefaultValue("MJKKB")]
        public string area { get; set; } = "MJKKB"; // ✅ default
    }

    public class RequestModelPosisiWIP
    {
        public DateTime datefrom { get; set; }
        public DateTime dateto { get; set; }
        [DefaultValue("")]
        public string itemfrom { get; set; }
        [DefaultValue("")]
        public string itemto { get; set; }

        [DefaultValue("MJKKB")]
        public string area { get; set; } = "MJKKB"; // ✅ default
    }

    public class RequestModelMutStok
    {
        public DateTime datefrom { get; set; }
        public DateTime dateto { get; set; }
        [DefaultValue("")]
        public string itemfrom { get; set; }
        [DefaultValue("")]
        public string itemto { get; set; }

        [DefaultValue("MJKKB")]
        public string area { get; set; } = "MJKKB"; // ✅ default
    }

    public class RequestModelHistLog
    {
        public DateTime datefrom { get; set; }
        public DateTime dateto { get; set; }
        [DefaultValue("")]
        public string userid { get; set; }
        [DefaultValue("")]
        public string trno { get; set; }

        [DefaultValue("MJKKB")]
        public string area { get; set; } = "MJKKB"; // ✅ default
    }

#endregion Report BC    
