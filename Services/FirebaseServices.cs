using FirebaseWebApi.Models;
using FireSharp;
using FireSharp.Config;
using FireSharp.Interfaces;

namespace DoAnWebAPI.Services
{
    public class FirebaseService
    {
        private readonly FirebaseClient _firebaseClient;
        public FirebaseService()
        {
            IFirebaseConfig config = new FirebaseConfig
            {
                AuthSecret = "ault-rtdb\tHgylkpY9BA0zLFPzyrfgo6BFNfKp4pjuv3zkeFVl",
                BasePath = "https://photogallerydb-196ef-default-rtdb.firebaseio.com/"
            };
            _firebaseClient = new FirebaseClient(config);
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