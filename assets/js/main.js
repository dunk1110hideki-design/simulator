'use strict';

/* =========================================================
  Utils
========================================================= */
const qs  = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const SELECT_PLAN_EVENT = 'select-plan';

function smoothScrollToSimulator() {
  const sec = qs('#simulator'); // ← sectionへ
  if (!sec) return;
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function flashSimulator() {
  const sec = qs('#simulator'); // ← sectionへ
  if (!sec) return;
  sec.classList.add('is-flash');
  window.setTimeout(() => sec.classList.remove('is-flash'), 600);
}

function writeHiddenEstimate(text) {
  const hidden = qs('input[name="estimate_summary"]');
  if (hidden) hidden.value = text;
}

function setSelectedPlanOnPage(planKey) {
  document.documentElement.dataset.selectedPlan = planKey;
}

/* =========================================================
  Vue App (Simulator)
========================================================= */
function mountSimulatorApp() {
  const mountEl = qs('#app-simulator');
  if (!mountEl) return null;

  const { createApp } = Vue;

  const app = createApp({
    data() {
      return {
        plans: [
          { key: 'light',    name: 'ライト',       base: 150000, includedPages: 3,  extraPerPage: 12000 },
          { key: 'standard', name: 'スタンダード', base: 300000, includedPages: 6,  extraPerPage: 11000 },
          { key: 'premium',  name: 'プレミアム',   base: 500000, includedPages: 10, extraPerPage: 10000 },
        ],
        options: [
          { key: 'form', name: 'お問い合わせフォーム',   price: 25000 },
          { key: 'sim',  name: '見積もりシミュレーター', price: 40000 },
          { key: 'wp',   name: 'WordPress組み込み',      price: 60000 },
          { key: 'cms',    name: 'CMS導入',           price: 50000 },
          { key: 'seo',    name: '高度なSEO対策',     price: 80000 },
          { key: 'anim',   name: 'アニメーション実装', price: 60000 },
          { key: 'api',    name: '外部API連携',       price: 100000 },
          { key: 'dash',   name: 'データ分析ダッシュボード', price: 120000 },
          { key: 'multi',  name: '多言語対応',         price: 150000 },
        ],

        planKey: 'standard',
        pages: 13,
        selectedOptions: ['sim'],
        hasTouchedPages: false,
      };
    },

    computed: {
      currentPlan() {
        return this.plans.find(p => p.key === this.planKey) ?? this.plans[0];
      },
      planBase() {
        return this.currentPlan.base; // ✅ 追加（templateのplanBase対応）
      },
      extraPages() {
        return Math.max(0, this.pages - this.currentPlan.includedPages);
      },
      extraPagesFee() {
        return this.extraPages * this.currentPlan.extraPerPage;
      },
      optionsFee() {
        const map = new Map(this.options.map(o => [o.key, o.price]));
        return this.selectedOptions.reduce((sum, k) => sum + (map.get(k) ?? 0), 0);
      },
      total() {
        return this.planBase + this.extraPagesFee + this.optionsFee;
      },
      summaryText() {
        const optNames = this.options
          .filter(o => this.selectedOptions.includes(o.key))
          .map(o => o.name);

        return [
          `プラン：${this.currentPlan.name}`,
          `ページ数：${this.pages}（追加 ${this.extraPages}）`,
          `オプション：${optNames.length ? optNames.join(' / ') : 'なし'}`,
          `合計：¥${this.total.toLocaleString()}`,
        ].join(' ｜ ');
      },
      selectedOptionObjects() {
        const set = new Set(this.selectedOptions);
        return this.options.filter(o => set.has(o.key));
      },
    },

    methods: {
      syncEstimateToForm() {
        writeHiddenEstimate(this.summaryText);
      },

      setPlan(planKey, { scroll = true } = {}) {
        const plan = this.plans.find(p => p.key === planKey);
        if (!plan) return;

        this.planKey = planKey;
        setSelectedPlanOnPage(planKey);

        // ユーザーが触ってなければ、プラン標準ページ数へ寄せる
        if (!this.hasTouchedPages) {
          this.pages = plan.includedPages;
        }

        if (scroll) {
          smoothScrollToSimulator();
          flashSimulator();
        }
      },

      incPages() {
        this.hasTouchedPages = true;
        this.pages = Math.min(30, (this.pages ?? 1) + 1);
      },
      decPages() {
        this.hasTouchedPages = true;
        this.pages = Math.max(1, (this.pages ?? 1) - 1);
      },

      goContact() {
        this.syncEstimateToForm();
        const sec = qs('#contact');
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    },

    watch: {
      summaryText() {
        this.syncEstimateToForm();
      },
    },

    mounted() {
      // ✅ 初期反映（1回だけ）
      this.syncEstimateToForm();
      setSelectedPlanOnPage(this.planKey);

      window.addEventListener(SELECT_PLAN_EVENT, (e) => {
        const planKey = e.detail?.planKey;
        if (planKey) this.setPlan(planKey, { scroll: true });
      });
    },

    template: `
        <div class="sim sim3">
          <!-- タイトル -->
          <header class="sim3__head">
            <h3 class="sim3__title">
              <span class="sim3__icon" aria-hidden="true"></span>
              見積もりシミュレーター
            </h3>
            <p class="sim3__lead">プランとオプションを選択して、おおよその制作費用を確認できます。</p>
          </header>

          <div class="sim3__panel">

            <!-- プラン -->
            <section class="sim3__section">
              <h4 class="sim3__sectionTitle">プランを選択</h4>

              <div class="sim3__seg" role="tablist" aria-label="plan">
                <button
                  v-for="p in plans"
                  :key="p.key"
                  type="button"
                  class="sim3__segBtn"
                  :class="{ 'is-active': planKey===p.key }"
                  @click="setPlan(p.key, { scroll:false })"
                >
                  {{ p.name }}
                </button>
              </div>
            </section>

            <!-- ページ数 -->
            <section class="sim3__section">
              <div class="sim3__block">
                <div class="sim3__blockHead">
                  <h4 class="sim3__blockTitle">ページ数</h4>
                </div>

                <div class="sim3__stepper">
                  <button class="sim3__stepBtn" type="button" @click="decPages" aria-label="decrease">−</button>

                  <div class="sim3__stepCenter">
                    <div class="sim3__stepValue">{{ pages }}</div>
                    <div class="sim3__stepUnit">ページ</div>
                  </div>

                  <button class="sim3__stepBtn" type="button" @click="incPages" aria-label="increase">＋</button>
                </div>

                <!-- (任意) 微調整用スライダー：見た目はスクショと違うので非表示にするならCSSで隠す -->
                <input
                  class="sim3__range"
                  type="range"
                  v-model.number="pages"
                  min="1"
                  max="30"
                  step="1"
                  @input="hasTouchedPages=true"
                />

                <div class="sim3__muted">追加 {{ extraPages }} ページ</div>
              </div>
            </section>

            <!-- オプション -->
            <section class="sim3__section">
              <div class="sim3__block">
                <div class="sim3__blockHead">
                  <h4 class="sim3__blockTitle">オプション</h4>
                </div>

                <div class="sim3__optGrid">
                  <label class="sim3__opt" v-for="o in options" :key="o.key">
                    <span class="sim3__optLeft">
                      <input class="sim3__check" type="checkbox" v-model="selectedOptions" :value="o.key" />
                      <span class="sim3__optName">{{ o.name }}</span>
                    </span>
                    <span class="sim3__optPrice">+¥{{ o.price.toLocaleString() }}</span>
                  </label>
                </div>
              </div>
            </section>

            <!-- 料金内訳 -->
            <section class="sim3__section">
              <div class="sim3__bill">
                <h4 class="sim3__billTitle">料金内訳</h4>

                <div class="sim3__billRow">
                  <div class="sim3__billLabel">{{ currentPlan.name }}プラン基本料金</div>
                  <div class="sim3__billValue">¥{{ planBase.toLocaleString() }}</div>
                </div>

                <div class="sim3__billRow" v-if="extraPagesFee > 0">
                  <div class="sim3__billLabel">追加ページ（{{ extraPages }}）</div>
                  <div class="sim3__billValue">¥{{ extraPagesFee.toLocaleString() }}</div>
                </div>

                <div class="sim3__billRow" v-for="o in selectedOptionObjects" :key="o.key">
                  <div class="sim3__billLabel">{{ o.name }}</div>
                  <div class="sim3__billValue">¥{{ o.price.toLocaleString() }}</div>
                </div>

                <div class="sim3__totalRow">
                  <div class="sim3__totalLabel">合計金額</div>
                  <div class="sim3__totalRight">
                    <div class="sim3__totalValue">¥{{ total.toLocaleString() }}</div>
                    <div class="sim3__tax">※ 税別価格です</div>
                  </div>
                </div>
              </div>
            </section>

            <!-- CTA -->
            <div class="sim3__ctaWrap">
              <button class="sim3__cta" type="button" @click="goContact">
                この内容で問い合わせる
              </button>
            </div>

          </div>
        </div>
      `,
  });

  app.mount('#app-simulator');
  return app;
}

/* =========================================================
  Pricing Buttons -> dispatch event
========================================================= */
function bindPricingButtons() {
  qsa('button[data-plan]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const planKey = btn.dataset.plan;
      if (!planKey) return;

      window.dispatchEvent(
        new CustomEvent(SELECT_PLAN_EVENT, { detail: { planKey } })
      );

      btn.blur();
    });
  });
}
/* =========================================================
  Boot
========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  mountSimulatorApp();
  bindPricingButtons();
});