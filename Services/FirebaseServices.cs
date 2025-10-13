using FireSharp; // ✅ THÊM
using FireSharp.Config;
using FireSharp.Interfaces;
using FirebaseWebApi.Models; // Giữ nguyên

namespace DoAnWebAPI.Services
{
    public class FirebaseService
    {
        // ✅ FIX: Thay đổi kiểu dữ liệu để sử dụng FireSharp client
        private readonly FireSharp.FirebaseClient _firebaseClient;

        // ✅ FIX: Sử dụng Dependency Injection (Constructor Injection)
        // Nhận client đã được cấu hình đúng từ Program.cs
        public FirebaseService(FireSharp.FirebaseClient firebaseClient)
        {
            _firebaseClient = firebaseClient;
        }

        // Generic Save
        public async Task SaveDataAsync<T>(string path, T data)
        {
            await _firebaseClient.SetAsync(path, data);
        }

        // Generic SetData 
        public async Task SetDataAsync<T>(string path, T data)
        {
            await SaveDataAsync(path, data);
        }

        // Generic Get
        public async Task<T?> GetDataAsync<T>(string path)
        {
            var response = await _firebaseClient.GetAsync(path);
            return response.ResultAs<T>();
        }

        // Generic Delete
        public async Task DeleteDataAsync(string path)
        {
            await _firebaseClient.DeleteAsync(path);
        }
    }
}