Rails.application.routes.draw do
  scope "(:locale)", locale: /#{I18n.available_locales.join("|")}/, defaults: {locale: "en"} do
    devise_for :administrators, controllers: {
                        sessions: 'admin/devise/sessions',
                        registrations: 'admin/devise/registrations',
                        passwords: 'admin/devise/passwords',
                        confirmations: 'admin/devise/confirmations',
                      }
    devise_for :users
    root to: redirect('/administrators/sign_in')
    mount Sidekiq::Web, at: '/administrator/sidekiq'

    namespace :admin do
      root to: 'dashboard#index'
      resources :administrators do
        member do
          get   :reset_password
          patch :update_password
          put   :update_password
        end
      end
      resources :users do
        get :comment,             to: 'users#comment'
        get :video,               to: 'users#video'
        get :likedpost,           to: 'users#likedpost'
        get :favoritepost,        to: 'users#favoritepost'
        get :favoritemusic,       to: 'users#favoritemusic'
        get :followers,           to: 'users#followers'
        get :followings,          to: 'users#followings'
        get :favoritemusic,       to: 'users#favoritemusic'
        get :favorite_class_room, to: 'users#favorite_class_room'
      end
      resources :instructors do
        get :list_student,        to: 'instructors#list_student'
        get :list_review,         to: 'instructors#list_review'
        get :earning,             to: 'instructors#earning'
        get :list_payout,         to: 'instructors#list_payout'
        put :change_suspend
        member do
          get   :onboarding
          patch :update_onboarding
          put   :update_onboarding
        end
      end
      resources :reviews
      resources :interests
      resources :hashtags
      resources :posts
      resources :events
      resources :event_refunds
      get '/event_refunds/:id/approve', to: 'event_refunds#approve', as: 'event_refund_approve'
      get '/event_refunds/:id/decline', to: 'event_refunds#decline', as: 'event_refund_decline'
      resources :comments
      resources :payout_methods, only: [:edit, :update, :destroy]
      resources :tickets do
        patch 'update_solution', on: :member
      end
      # resources :exchange_rates, only: [:index, :edit, :update]
      resources :exchange_rates do
        get 'update_rate_worker', on: :collection
      end

      resources :reports do
        put :report_user
        put :report_video
        put :report_classroom
        put :report_comment
      end
      resources :livestreams do
        put :change_status
        get :booking,             to: 'livestreams#booking'
      end
      resources :videoclasses do
        get :content,             to: 'videoclasses#content'
        put :unpublish
      end
      resources :virtualclasses do
        get :content,             to: 'virtualclasses#content'
        get :schedule,            to: 'virtualclasses#schedule'
        put :unpublish
      end
      resources :courses, only: [:edit, :update]
      resources :sales
      resources :refunds
      resources :payouts
      resources :musics
      resources :banners
      resources :announcements
      resources :course_schedules, only: [:show, :edit, :update]
      resources :course_schedules, only: [:edit, :update]

      get "/dashboard", to: 'dashboard#index'
      get "/dashboard/data_statistics", to: 'dashboard#data_statistics'
      get '/refunds/:id/approve', to: 'refunds#approve', as: 'refund_approve'
      get '/refunds/:id/decline', to: 'refunds#decline', as: 'refund_decline'
    end
  end

  mount API::Base, at: "/"
  mount GrapeSwaggerRails::Engine, at: "/documentation"
end
