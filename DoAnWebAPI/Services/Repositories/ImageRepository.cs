// File: Services/Repositories/ImageRepository.cs

using DoAnWebAPI.Model; // SỬA LỖI 1: Thêm using này để nhận diện các lớp Model như Image, Like, Stat...
using DoAnWebAPI.Model.DTO.Image;
using DoAnWebAPI.Model.DTO.Tag;
using DoAnWebAPI.Model.DTO.Topics;
using DoAnWebAPI.Services.Interface;
using FirebaseWebApi.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DoAnWebAPI.Services.Repositories
{
    public class ImageRepository : IImageRepository
    {
        private readonly FireSharp.FirebaseClient _firebase;
        private readonly IStatRepository _statRepository;
        private readonly ILikeRepository _likeRepository;
        private readonly ITagRepository _tagRepository;
        private readonly ITopicRepository _topicRepository;

        public ImageRepository(
            FireSharp.FirebaseClient firebase,
            IStatRepository statRepository,
            ILikeRepository likeRepository,
            ITagRepository tagRepository,
            ITopicRepository topicRepository)
        {
            _firebase = firebase;
            _statRepository = statRepository;
            _likeRepository = likeRepository;
            _tagRepository = tagRepository;
            _topicRepository = topicRepository;
        }

        public async Task<IEnumerable<ImageDTO>> GetAllAsync(int? currentUserId = null)
        {
            var imageResponse = await _firebase.GetAsync("images");
            if (imageResponse.Body == "null") return new List<ImageDTO>();

            var imagesData = imageResponse.ResultAs<Dictionary<string, Image>>();
            if (imagesData == null) return new List<ImageDTO>();

            var allStats = await _statRepository.GetAllAsync();
            var allTags = await _tagRepository.GetAllAsync();
            var allTopics = await _topicRepository.GetAllAsync();
            var userLikes = currentUserId.HasValue
                ? await _likeRepository.GetLikesByUserIdAsync(currentUserId.Value)
                : new List<Like>();

            var imageDtos = imagesData.Values.Select(image =>
            {
                var stat = allStats.FirstOrDefault(s => s.ImageId == image.Id);
                var tagsForImage = allTags
                    .Where(tag => image.TagIds?.Contains(tag.Id) ?? false)
                    .Select(tag => new TagDTO { Id = tag.Id, Name = tag.Name })
                    .ToList();
                var topicsForImage = allTopics
                    .Where(topic => image.TopicIds?.Contains(topic.Id) ?? false)
                    .Select(topic => new TopicDTO { Id = topic.Id, Name = topic.Name })
                    .ToList();

                return new ImageDTO
                {
                    Id = image.Id,
                    UserId = image.UserId,
                    Title = image.Title,
                    Description = image.Description,
                    FileUrl = image.FileUrl,
                    ThumbnailUrl = image.ThumbnailUrl,
                    IsPublic = image.IsPublic,
                    Status = image.Status,
                    Tags = tagsForImage,
                    Topics = topicsForImage,
                    LikeCount = stat?.LikesCount ?? 0,
                    IsLikedByCurrentUser = userLikes.Any(l => l.ImageId == image.Id)
                };
            }).ToList();

            return imageDtos.OrderByDescending(i => i.Id);
        }

        public async Task<ImageDTO?> GetByIdAsync(string id, int? currentUserId = null)
        {
            var response = await _firebase.GetAsync($"images/{id}");
            if (response.Body == "null") return null;

            var image = response.ResultAs<Image>();
            if (image == null) return null;

            var stat = await _statRepository.GetStatByImageIdAsync(image.Id);
            var isLiked = false;
            if (currentUserId.HasValue)
            {
                isLiked = (await _likeRepository.GetLikeByImageAndUserAsync(image.Id, currentUserId.Value)) != null;
            }

            // SỬA LỖI 2: Lấy tất cả tags/topics rồi lọc trong bộ nhớ thay vì gọi hàm không tồn tại
            var allTags = await _tagRepository.GetAllAsync();
            var tagsForImage = allTags
                .Where(tag => image.TagIds?.Contains(tag.Id) ?? false)
                .Select(t => new TagDTO { Id = t.Id, Name = t.Name })
                .ToList();

            var allTopics = await _topicRepository.GetAllAsync();
            var topicsForImage = allTopics
                .Where(topic => image.TopicIds?.Contains(topic.Id) ?? false)
                .Select(t => new TopicDTO { Id = t.Id, Name = t.Name })
                .ToList();

            return new ImageDTO
            {
                Id = image.Id,
                UserId = image.UserId,
                Title = image.Title,
                Description = image.Description,
                FileUrl = image.FileUrl,
                ThumbnailUrl = image.ThumbnailUrl,
                IsPublic = image.IsPublic,
                Status = image.Status,
                Tags = tagsForImage,
                Topics = topicsForImage,
                LikeCount = stat?.LikesCount ?? 0,
                IsLikedByCurrentUser = isLiked
            };
        }

        public async Task<ImageDTO> CreateAsync(int userId, string title, string? description, bool isPublic, List<int> tagIds, List<int> topicIds, string fileUrl, string thumbnailUrl, long size, int width, int height)
        {
            var image = new Image
            {
                Id = new Random().Next(100000, 999999), // Tăng khoảng để tránh trùng lặp
                UserId = userId,
                Title = title,
                Description = description ?? string.Empty,
                FileUrl = fileUrl,
                ThumbnailUrl = thumbnailUrl,
                SizeBytes = size,
                Width = width,
                Height = height,
                IsPublic = isPublic,
                Status = "pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                TagIds = tagIds,
                TopicIds = topicIds
            };

            await _firebase.SetAsync($"images/{image.Id}", image);

            // TỐI ƯU 3: Tự tạo DTO thay vì gọi lại GetByIdAsync để tiết kiệm 1 lượt gọi API
            return new ImageDTO
            {
                Id = image.Id,
                UserId = image.UserId,
                Title = image.Title,
                Description = image.Description,
                FileUrl = image.FileUrl,
                ThumbnailUrl = image.ThumbnailUrl,
                IsPublic = image.IsPublic,
                Status = image.Status,
                Tags = new List<TagDTO>(), // Khi mới tạo, chưa có DTO chi tiết, trả về rỗng
                Topics = new List<TopicDTO>(),
                LikeCount = 0,
                IsLikedByCurrentUser = false
            };
        }

        public async Task<bool> UpdateAsync(string id, UpdateImageDTO dto)
        {
            var response = await _firebase.GetAsync($"images/{id}");
            if (response.Body == "null") return false;
            var image = response.ResultAs<Image>();
            if (image == null) return false;

            image.Title = dto.Title ?? image.Title;
            image.Description = dto.Description ?? image.Description;
            image.IsPublic = dto.IsPublic ?? image.IsPublic;
            image.TagIds = dto.TagIds ?? image.TagIds;
            image.TopicIds = dto.TopicIds ?? image.TopicIds;
            image.UpdatedAt = DateTime.UtcNow;

            await _firebase.UpdateAsync($"images/{id}", image);
            return true;
        }

        public async Task<bool> DeleteAsync(string id)
        {
            // Nên xóa cả các dữ liệu liên quan (stats, likes, ...) nhưng tạm thời để đơn giản
            await _firebase.DeleteAsync($"images/{id}");
            return true;
        }

        public async Task<IEnumerable<ImageDTO>> GetByUserIdAsync(int userId)
        {
            // Cách làm này tận dụng lại logic đã có trong GetAllAsync
            // để lấy tất cả ảnh và các thông tin liên quan.
            var allImages = await GetAllAsync();

            // Dùng LINQ để lọc ra những ảnh có UserId khớp.
            return allImages.Where(img => img.UserId == userId);
        }
    }
}