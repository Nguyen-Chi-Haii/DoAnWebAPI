using Newtonsoft.Json;

namespace DoAnWebAPI.Model
{
    public class AdminLog
    {
        [JsonProperty("id")]
        public int Id { get; set; }

        [JsonProperty("admin_id")]
        public int AdminId { get; set; }

        [JsonProperty("action_type")]
        public string ActionType { get; set; }

        [JsonProperty("target_id")]
        public int Target { get; set; }

        [JsonProperty("meta")]
        public object Meta { get; set; } // Hoặc Dictionary<string, object> Meta { get; set; }

        [JsonProperty("created_at")]
        public DateTime CreatedAt { get; set; }
    }
}
