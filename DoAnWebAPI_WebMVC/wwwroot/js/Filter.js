// filter.js
const topics = ["Nature", "Art", "Tech", "People", "Animals"];
let selectedTopic = null;

const topicFiltersContainer = document.getElementById('topic-filters');
const currentTopicDisplay = document.getElementById('current-topic');

const updateTopicDisplay = () => {
    if (currentTopicDisplay) currentTopicDisplay.textContent = selectedTopic || "Chưa chọn";
};

const renderTopics = () => {
    if (!topicFiltersContainer) return;

    topicFiltersContainer.innerHTML = topics.map(topic => {
        const isActive = topic === selectedTopic;
        const classes = isActive
            ? "bg-gray-800 text-white font-semibold shadow-md"
            : "border-gray-300 text-black hover:bg-gray-200";

        return `<button data-topic="${topic}" class="px-3 py-1 rounded-full border ${classes} transition text-sm">${topic}</button>`;
    }).join('');

    updateTopicDisplay();
};

const handleTopicClick = (e) => {
    const button = e.target.closest('button[data-topic]');
    if (!button) return;
    const topic = button.dataset.topic;
    selectedTopic = (topic === selectedTopic) ? null : topic;
    renderTopics();
};

document.addEventListener('DOMContentLoaded', () => {
    renderTopics();
    if (topicFiltersContainer) topicFiltersContainer.addEventListener('click', handleTopicClick);
});
