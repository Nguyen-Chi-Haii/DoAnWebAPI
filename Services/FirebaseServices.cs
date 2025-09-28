using FirebaseWebApi.Models;
using FireSharp;
using FireSharp.Config;
using FireSharp.Interfaces;

namespace FirebaseWebApi.Services
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

        // Create a user
        public async Task<User> CreateUserAsync(User user)
        {
            await _firebaseClient.SetAsync($"users/user_{user.Id}", user);
            return user;
        }

        // Get a user by ID
        public async Task<User> GetUserAsync(int id)
        {
            var response = await _firebaseClient.GetAsync($"users/user_{id}");
            return response.ResultAs<User>();
        }

        // Create an image
        public async Task<Image> CreateImageAsync(Image image)
        {
            await _firebaseClient.SetAsync($"images/image_{image.Id}", image);
            return image;
        }

        // Get all images for a user
        public async Task<List<Image>> GetImagesByUserAsync(int userId)
        {
            var response = await _firebaseClient.GetAsync("images");
            var imagesDict = response.ResultAs<Dictionary<string, Image>>();
            if (imagesDict == null)
                return new List<Image>();
            return imagesDict.Values.Where(x => x.UserId == userId).ToList();
        }

        // Add similar methods for other entities (PendingImages, Likes, etc.)
    }
}