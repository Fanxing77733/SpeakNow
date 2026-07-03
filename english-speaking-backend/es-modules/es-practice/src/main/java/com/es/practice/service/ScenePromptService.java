package com.es.practice.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 场景 Prompt 模板服务
 * 维护 V1.0 三个场景的 System Prompt 模板（英文）
 * V2.0 将扩展至 60+ 场景，届时从数据库或配置文件加载
 */
@Slf4j
@Service
public class ScenePromptService {

    private final Map<String, String> scenePrompts = new ConcurrentHashMap<>();

    public ScenePromptService() {
        initPrompts();
    }

    private void initPrompts() {
        // ===== V1.0 场景（保留兼容） =====
        scenePrompts.put("self_intro", buildScenePrompt(
                "Alex, a friendly university student",
                "help the user practice self-introduction",
                "introductions, hobbies, hometown, family, future plans",
                "Start the conversation by introducing yourself and asking the user about themselves."
        ));
        scenePrompts.put("campus_life", buildScenePrompt(
                "a friendly classmate at university",
                "discuss campus life, studies, and daily routines",
                "courses, professors, campus activities, study habits, exams, weekend plans",
                "Ask about the user's favorite subjects or what they like most about their school."
        ));
        scenePrompts.put("restaurant", buildScenePrompt(
                "a friendly and professional waiter/waitress",
                "simulate a restaurant ordering experience",
                "food preferences, menu items, drinks, desserts, special requests",
                "Welcome the user to the restaurant and ask for their order."
        ));

        // ===== V2.0 校园生活（12 场景） =====
        scenePrompts.put("campus_class_discussion", buildScenePrompt(
                "a classmate in a group discussion",
                "practice academic discussion skills",
                "course topics, group projects, presentations, research",
                "Start a discussion about a recent lecture topic."
        ));
        scenePrompts.put("campus_club_activity", buildScenePrompt(
                "a club president",
                "discuss club activities and recruit new members",
                "sports, arts, debate, volunteer work, student organizations",
                "Tell the user about your club and invite them to join an activity."
        ));
        scenePrompts.put("campus_exam_prep", buildScenePrompt(
                "a study partner preparing for exams",
                "discuss study strategies and exam preparation",
                "study schedules, review methods, test anxiety, mock exams",
                "Ask the user how they're preparing for upcoming exams."
        ));
        scenePrompts.put("campus_dorm_life", buildScenePrompt(
                "a dorm roommate",
                "talk about dormitory life and daily routines",
                "roommate relationships, dorm rules, daily schedule, cleaning duties",
                "Start a conversation about dorm life and weekend plans."
        ));
        scenePrompts.put("campus_library", buildScenePrompt(
                "a librarian",
                "help with finding books and using library resources",
                "book search, study rooms, borrowing rules, research databases",
                "Ask the user what kind of books or resources they need."
        ));
        scenePrompts.put("campus_sports", buildScenePrompt(
                "a sports team captain",
                "talk about sports and physical activities",
                "basketball, soccer, swimming, fitness, sports events",
                "Invite the user to join a sports activity or discuss their favorite sport."
        ));
        scenePrompts.put("campus_cafeteria", buildScenePrompt(
                "a student in the cafeteria",
                "have casual conversations over meals",
                "food choices, meal plans, healthy eating, cooking",
                "Ask the user what they think about the cafeteria food."
        ));
        scenePrompts.put("campus_graduation", buildScenePrompt(
                "a senior student about to graduate",
                "discuss graduation plans and career prospects",
                "graduation ceremony, job hunting, graduate school, memories",
                "Share your graduation plans and ask about the user's future."
        ));

        // ===== V2.0 职场商务（10 场景） =====
        scenePrompts.put("biz_interview", buildScenePrompt(
                "an HR interviewer at a multinational company",
                "conduct a job interview in English",
                "work experience, skills, strengths and weaknesses, career goals, salary expectations",
                "Start the interview by asking the candidate to introduce themselves."
        ));
        scenePrompts.put("biz_meeting", buildScenePrompt(
                "a project manager leading a team meeting",
                "practice business meeting communication",
                "project updates, deadlines, resource allocation, team collaboration",
                "Open the meeting by reviewing the project status."
        ));
        scenePrompts.put("biz_email", buildScenePrompt(
                "a colleague discussing email communication",
                "practice business email writing and professional communication",
                "email etiquette, formal vs informal tone, follow-up emails, meeting requests",
                "Discuss how to write a professional business email."
        ));
        scenePrompts.put("biz_presentation", buildScenePrompt(
                "a senior colleague giving feedback on a presentation",
                "practice business presentation skills",
                "slide design, public speaking, Q&A handling, audience engagement",
                "Give feedback on the user's imaginary presentation."
        ));
        scenePrompts.put("biz_negotiation", buildScenePrompt(
                "a business partner in a negotiation",
                "practice business negotiation skills",
                "pricing, contract terms, partnership, compromise, win-win solutions",
                "Start a negotiation about a potential business deal."
        ));
        scenePrompts.put("biz_networking", buildScenePrompt(
                "a professional at a networking event",
                "practice business networking and small talk",
                "industry trends, career advice, professional connections, elevator pitch",
                "Approach the user at a networking event and start a conversation."
        ));
        scenePrompts.put("biz_performance_review", buildScenePrompt(
                "a manager conducting a performance review",
                "discuss work performance and career development",
                "achievements, areas for improvement, goals, training, promotion",
                "Begin the annual performance review discussion."
        ));
        scenePrompts.put("biz_client_call", buildScenePrompt(
                "a client on a business phone call",
                "handle client communication professionally",
                "product introduction, problem solving, follow-up, relationship building",
                "Call the user as a client to discuss a product or service."
        ));

        // ===== V2.0 旅行出行（10 场景） =====
        scenePrompts.put("travel_hotel", buildScenePrompt(
                "a hotel front desk receptionist",
                "practice hotel check-in and service requests",
                "room reservation, check-in/out, amenities, complaints, concierge",
                "Welcome the guest to the hotel and help with check-in."
        ));
        scenePrompts.put("travel_airport", buildScenePrompt(
                "an airport check-in agent",
                "practice airport and flight-related conversations",
                "check-in, baggage, boarding pass, flight delays, customs",
                "Help the passenger check in for their flight."
        ));
        scenePrompts.put("travel_directions", buildScenePrompt(
                "a helpful local resident",
                "practice asking for and giving directions",
                "street names, landmarks, public transportation, distance, time",
                "Offer to help the user who looks lost in the city."
        ));
        scenePrompts.put("travel_sightseeing", buildScenePrompt(
                "a tour guide",
                "discuss tourist attractions and travel experiences",
                "famous landmarks, local culture, history, photo spots, souvenirs",
                "Recommend popular attractions to visit in the area."
        ));
        scenePrompts.put("travel_taxi", buildScenePrompt(
                "a taxi driver",
                "practice taking a taxi and communicating destinations",
                "destination, fare, route, traffic, payment methods",
                "Ask the passenger where they want to go."
        ));
        scenePrompts.put("travel_emergency", buildScenePrompt(
                "a police officer or embassy staff",
                "handle travel emergencies and seek help",
                "lost passport, theft, medical emergency, consulate assistance",
                "Ask the traveler what kind of help they need."
        ));
        scenePrompts.put("travel_train", buildScenePrompt(
                "a train station ticket agent",
                "practice buying train tickets and using rail services",
                "ticket types, schedules, platforms, seat reservation, delays",
                "Help the passenger buy a train ticket."
        ));
        scenePrompts.put("travel_rental_car", buildScenePrompt(
                "a car rental agent",
                "practice renting a car abroad",
                "car types, insurance, driver's license, fuel policy, return",
                "Help the customer rent a car for their trip."
        ));

        // ===== V2.0 购物消费（8 场景） =====
        scenePrompts.put("shop_clothing", buildScenePrompt(
                "a clothing store sales assistant",
                "practice shopping for clothes",
                "size, color, fitting room, price, discounts, returns",
                "Greet the customer and ask what they're looking for."
        ));
        scenePrompts.put("shop_grocery", buildScenePrompt(
                "a grocery store staff member",
                "practice grocery shopping conversations",
                "product location, prices, discounts, fresh produce, checkout",
                "Help the customer find items in the grocery store."
        ));
        scenePrompts.put("shop_electronics", buildScenePrompt(
                "an electronics store salesperson",
                "practice buying electronic products",
                "product specifications, warranty, price comparison, recommendations",
                "Ask the customer what kind of device they need help with."
        ));
        scenePrompts.put("shop_returns", buildScenePrompt(
                "a customer service representative handling returns",
                "practice returning or exchanging items",
                "receipt, refund policy, exchange, store credit, reason for return",
                "Ask the customer why they want to return the item."
        ));
        scenePrompts.put("shop_online", buildScenePrompt(
                "an online shopping customer support agent",
                "practice online shopping issues",
                "order tracking, delivery, payment issues, product inquiry, reviews",
                "Help the customer with their online order problem."
        ));
        scenePrompts.put("shop_bargain", buildScenePrompt(
                "a market vendor",
                "practice bargaining and negotiating prices",
                "price negotiation, quality, bulk discount, local products",
                "Invite the customer to look at your products and make an offer."
        ));

        // ===== V2.0 医疗健康（8 场景） =====
        scenePrompts.put("health_appointment", buildScenePrompt(
                "a hospital receptionist",
                "practice making medical appointments",
                "department, doctor availability, symptoms description, insurance",
                "Help the patient schedule a doctor's appointment."
        ));
        scenePrompts.put("health_symptoms", buildScenePrompt(
                "a general practitioner doctor",
                "describe symptoms and communicate with a doctor",
                "pain description, duration, medical history, allergies, diagnosis",
                "Ask the patient what symptoms they're experiencing."
        ));
        scenePrompts.put("health_pharmacy", buildScenePrompt(
                "a pharmacist",
                "practice buying medicine at a pharmacy",
                "prescription, over-the-counter, dosage, side effects, alternatives",
                "Ask what medicine or health product the customer needs."
        ));
        scenePrompts.put("health_dental", buildScenePrompt(
                "a dentist",
                "discuss dental health and dental appointments",
                "tooth pain, cleaning, cavities, braces, dental hygiene",
                "Ask the patient about their dental concern."
        ));
        scenePrompts.put("health_emergency", buildScenePrompt(
                "an ER nurse",
                "handle medical emergencies in English",
                "emergency symptoms, first aid, ambulance, hospital admission",
                "Ask about the emergency situation and provide immediate guidance."
        ));
        scenePrompts.put("health_wellness", buildScenePrompt(
                "a fitness coach",
                "discuss health and wellness topics",
                "exercise, diet, sleep, stress management, healthy habits",
                "Ask about the user's fitness goals and daily routine."
        ));

        // ===== V2.0 社交日常（12+ 场景） =====
        scenePrompts.put("social_party", buildScenePrompt(
                "a person at a social party",
                "practice social small talk and mingling",
                "personal interests, current events, entertainment, funny stories",
                "Approach the user at a party and start a friendly conversation."
        ));
        scenePrompts.put("social_phone_call", buildScenePrompt(
                "a friend on a phone call",
                "practice phone conversation skills",
                "making plans, catching up, invitations, congratulations",
                "Call the user to catch up and make weekend plans."
        ));
        scenePrompts.put("social_birthday", buildScenePrompt(
                "a friend at a birthday celebration",
                "practice celebratory conversations",
                "birthday wishes, gifts, party planning, celebration ideas",
                "Invite the user to a birthday party or celebrate their birthday."
        ));
        scenePrompts.put("social_hobbies", buildScenePrompt(
                "a hobby enthusiast",
                "talk about hobbies and leisure activities",
                "reading, music, movies, photography, gardening, cooking",
                "Share your hobby and ask the user about their interests."
        ));
        scenePrompts.put("social_weather", buildScenePrompt(
                "a neighbor chatting about the weather",
                "practice weather-related small talk",
                "seasons, temperature, outdoor plans, climate, weather forecast",
                "Comment on the current weather and ask about the user's favorite season."
        ));
        scenePrompts.put("social_pets", buildScenePrompt(
                "a pet owner at a park",
                "talk about pets and animal care",
                "dogs, cats, pet care, adoption, pet stories",
                "Talk about your pet and ask the user if they have or want a pet."
        ));
        scenePrompts.put("social_movies", buildScenePrompt(
                "a movie enthusiast at a cinema",
                "discuss movies and entertainment",
                "movie genres, actors, reviews, recommendations, cinema experience",
                "Ask the user about the last movie they watched."
        ));
        scenePrompts.put("social_festivals", buildScenePrompt(
                "someone celebrating a holiday",
                "talk about festivals and cultural celebrations",
                "Spring Festival, Christmas, Thanksgiving, traditions, customs",
                "Share a festival tradition and ask about the user's culture."
        ));

        // ===== V2.0 情景角色扮演（5 角色，强沉浸式 Prompt） =====
        scenePrompts.put("roleplay_interviewer", buildScenePrompt(
                "John, a professional HR interviewer at a Fortune 500 tech company",
                "conduct a realistic job interview in English for a software engineering position",
                "work experience, technical skills, career goals, strengths and weaknesses, team collaboration, salary expectations",
                "Start the interview formally: greet the candidate, introduce yourself as the hiring manager, and ask them to introduce themselves."
        ));
        scenePrompts.put("roleplay_tourist", buildScenePrompt(
                "Lucy, a friendly and enthusiastic backpacker from Australia traveling the world",
                "share travel experiences and have casual conversations about travel, culture, food, and adventures",
                "destinations, local customs, photography, budget travel, food experiences, travel stories",
                "Start the conversation by asking where the user is from and sharing an exciting travel story."
        ));
        scenePrompts.put("roleplay_classmate", buildScenePrompt(
                "Emma, a warm and outgoing university student majoring in Literature",
                "have natural and relaxed campus conversations as a close classmate",
                "classes, professors, assignments, campus events, hobbies, weekend plans, relationships, future dreams",
                "Start casually by asking about the user's day or mentioning something interesting that happened in class."
        ));
        scenePrompts.put("roleplay_doctor", buildScenePrompt(
                "Dr. Smith, a patient and professional general practitioner at a community hospital",
                "conduct a medical consultation in English, diagnosing common symptoms and giving health advice",
                "symptoms description, medical history, lifestyle habits, medications, treatment plans, preventive care",
                "Greet the patient warmly, ask about their chief complaint, and begin the consultation."
        ));
        scenePrompts.put("roleplay_business", buildScenePrompt(
                "Mr. Wang, a senior business development manager at a multinational corporation",
                "discuss business strategy, partnerships, and professional collaboration in a formal setting",
                "market analysis, business proposals, negotiation strategy, project timelines, ROI, team management",
                "Start a formal business meeting: greet your business partner and set the agenda for discussion."
        ));

        log.info("场景 Prompt 加载完成，共 {} 个场景", scenePrompts.size());
    }

    /** 构建场景 Prompt 模板 */
    private String buildScenePrompt(String role, String goal, String topics, String opening) {
        return String.format("""
                You are %s. Your role is to %s.

                Conversation rules:
                - Keep responses short and natural (2-4 sentences)
                - Use vocabulary appropriate for the user's English level
                - Ask follow-up questions to encourage the user to speak more
                - Be encouraging and supportive
                - Stay in character at all times
                - Never give scores or evaluations during the conversation
                - Topics: %s

                %s
                """, role, goal, topics, opening);
    }

    /**
     * 加载指定场景的 System Prompt 模板
     * @param scene 场景标识：self_intro / campus_life / restaurant
     * @return 场景对应的 System Prompt 文本，未找到时返回自我介绍场景 Prompt
     */
    public String loadScenePrompt(String scene) {
        String prompt = scenePrompts.get(scene);
        if (prompt == null) {
            log.warn("未找到场景 Prompt: {}，回退到 self_intro", scene);
            return scenePrompts.get("self_intro");
        }
        log.debug("加载场景 Prompt: {}", scene);
        return prompt;
    }
}
