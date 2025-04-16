// Регистрация шрифта в jsPDF
    async function registerFont(doc) {
      try {
        // URL ваших шрифтов на CDN
        const fontUrls = {
          regular: 'https://roviosda.github.io/fonts-for-pdf/my-fonts/NotoSans-Regular.ttf',
          bold: 'https://roviosda.github.io/fonts-for-pdf/my-fonts/NotoSans-Bold.ttf',
          italic: 'https://roviosda.github.io/fonts-for-pdf/my-fonts/NotoSans-Italic.ttf'
        };
        // Функция для загрузки и регистрации шрифта
        const loadAndRegisterFont = async(url, style) => {
          const response = await fetch(url);
          const fontData = await response.arrayBuffer();
          const fontName = `NotoSans-${style.charAt(0).toUpperCase() + style.slice(1)}.ttf`;
          // Конвертируем ArrayBuffer в Base64
          let binary = '';
          const bytes = new Uint8Array(fontData);
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = window.btoa(binary);
          doc.addFileToVFS(fontName, base64);
          doc.addFont(fontName, "NotoSans", style);
        };
        // Загружаем и регистрируем все варианты шрифта
        await Promise.all([
          loadAndRegisterFont(fontUrls.regular, 'normal'),
          loadAndRegisterFont(fontUrls.bold, 'bold'),
          loadAndRegisterFont(fontUrls.italic, 'italic')
        ]);
        // Устанавливаем обычный шрифт по умолчанию
        doc.setFont("NotoSans", "normal");
      } catch (error) {
        console.error('Ошибка загрузки шрифтов:', error);
        // Fallback на стандартные шрифты PDF
        doc.setFont("helvetica", "normal");
      }
    }
    // Проверка достаточно ли места
    function checkPageSpace(doc, yPos, spaceNeeded = 50) {
      // spaceNeeded - минимальное необходимое место для блока (заголовок + текст)
      if (yPos + spaceNeeded > doc.internal.pageSize.getHeight() - 20) {
        addFooter(doc);
        doc.addPage();
        return 20; // возвращаем новую позицию Y в начале страницы
      }
      return yPos; // возвращаем текущую позицию, если места достаточно
    }
    // Форматирование жирного начертания
    function addFormattedText(doc, text, yPos, options = {}) {
      const {
        fontSize = 12, margin = 15, isBold = false, textColor = [0, 0, 0]
      } = options;
      const pageWidth = doc.internal.pageSize.getWidth();
      const originalFont = doc.getFont();
      const originalSize = doc.getFontSize();
      const originalColor = doc.getTextColor();
      doc.setFontSize(fontSize);
      doc.setFont('NotoSans', isBold ? 'bold' : 'normal');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      // Обработка тегов <b>
      const parts = text.split(/(<b>|<\/b>)/);
      let currentY = yPos;
      let boldMode = false;
      for (const part of parts) {
        if (part === '<b>') {
          boldMode = true;
          doc.setFont('NotoSans', 'bold');
          continue;
        }
        if (part === '</b>') {
          boldMode = false;
          doc.setFont('NotoSans', 'normal');
          continue;
        }
        const lines = doc.splitTextToSize(part, pageWidth - 2 * margin);
        for (const line of lines) {
          // Проверяем, достаточно ли места для строки
          const lineHeight = doc.getTextDimensions(line).h;
          if (currentY + lineHeight > doc.internal.pageSize.getHeight() - 20) {
            addFooter(doc);
            doc.addPage();
            currentY = 20;
          }
          doc.text(line, margin, currentY);
          currentY += lineHeight + 5;
        }
      }
      // Восстановление оригинальных настроек
      doc.setFont(originalFont.fontName, originalFont.fontStyle);
      doc.setFontSize(originalSize);
      doc.setTextColor(originalColor);
      return currentY;
    }

    function addFooter(doc) {
      const pageCount = doc.internal.getNumberOfPages();
      const originalTextColor = doc.getTextColor(); // Сохраняем исходный цвет текста
      const originalFontSize = doc.getFontSize(); // Сохраняем исходный размер шрифта
      const originalFont = doc.getFont(); // Сохраняем жирность
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFont("NotoSans", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100); // Серый цвет для футера
        doc.text(
          'Сайт: hardipeople.com | Подробнее о курсах: hardipeople.com/course',
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10, {
            align: 'center'
          }
        );
        doc.setTextColor(originalTextColor); // Возвращаем исходный цвет текста
        doc.setFontSize(originalFontSize); // Возвращаем исходный размер текста
        doc.setFont(originalFont.fontName, originalFont.fontStyle);
      }
    }
    // Вопросы теста с указанием шкалы и типа (прямой/обратный)
    const questions = [{
      text: "Я часто не уверен в собственных решениях.",
      scale: "control",
      reverse: true
    }, {
      text: "Иногда мне кажется, что никому нет до меня дела.",
      scale: "involvement",
      reverse: true
    }, {
      text: "Часто, даже хорошо выспавшись, я с трудом заставляю себя встать с постели.",
      scale: "involvement",
      reverse: true
    }, {
      text: "Я постоянно занят, и мне это нравится.",
      scale: "involvement",
      reverse: false
    }, {
      text: "Часто я предпочитаю плыть по течению.",
      scale: "control",
      reverse: true
    }, {
      text: "Я меняю свои планы в зависимости от обстоятельств.",
      scale: "control",
      reverse: true
    }, {
      text: "Меня раздражают события, из-за которых я вынужден менять свой распорядок дня.",
      scale: "risk",
      reverse: true
    }, {
      text: "Непредвиденные трудности порой сильно утомляют меня.",
      scale: "control",
      reverse: true
    }, {
      text: "Я всегда контролирую ситуацию настолько, насколько это необходимо.",
      scale: "control",
      reverse: false
    }, {
      text: "Порой я так устаю, что уже ничто не может заинтересовать меня.",
      scale: "involvement",
      reverse: true
    }, {
      text: "Порой все, что я делаю, кажется мне бесполезным.",
      scale: "involvement",
      reverse: true
    }, {
      text: "Я стараюсь быть в курсе всего происходящего вокруг меня.",
      scale: "involvement",
      reverse: false
    }, {
      text: "Лучше синица в руках, чем журавль в небе.",
      scale: "risk",
      reverse: true
    }, {
      text: "Вечером я часто чувствую себя совершенно разбитым.",
      scale: "involvement",
      reverse: true
    }, {
      text: "Я предпочитаю ставить перед собой труднодостижимые цели и добиваться их.",
      scale: "control",
      reverse: false
    }, {
      text: "Иногда меня пугают мысли о будущем.",
      scale: "control",
      reverse: true
    }, {
      text: "Я всегда уверен, что смогу воплотить в жизнь то, что задумал.",
      scale: "control",
      reverse: false
    }, {
      text: "Мне кажется, я не живу полной жизнью, а только играю роль.",
      scale: "risk",
      reverse: true
    }, {
      text: "Мне кажется, если бы в прошлом у меня было меньше разочарований и невзгод, мне было бы сейчас легче жить на свете.",
      scale: "risk",
      reverse: true
    }, {
      text: "Возникающие проблемы часто кажутся мне неразрешимыми.",
      scale: "control",
      reverse: true
    }, {
      text: "Испытав поражение, я буду пытаться взять реванш.",
      scale: "control",
      reverse: false
    }, {
      text: "Я люблю знакомиться с новыми людьми.",
      scale: "involvement",
      reverse: false
    }, {
      text: "Когда кто-нибудь жалуется, что жизнь скучна, это значит, что он просто не умеет видеть интересное.",
      scale: "involvement",
      reverse: false
    }, {
      text: "Мне всегда есть чем заняться.",
      scale: "involvement",
      reverse: false
    }, {
      text: "Я всегда могу повлиять на результат того, что происходит вокруг.",
      scale: "control",
      reverse: false
    }, {
      text: "Я часто сожалею о том, что уже сделано.",
      scale: "risk",
      reverse: true
    }, {
      text: "Если проблема требует больших усилий, я предпочитаю отложить ее до лучших времен.",
      scale: "control",
      reverse: true
    }, {
      text: "Мне трудно сближаться с другими людьми.",
      scale: "involvement",
      reverse: true
    }, {
      text: "Как правило, окружающие слушают меня внимательно.",
      scale: "involvement",
      reverse: false
    }, {
      text: "Если бы я мог, я многое изменил бы в прошлом.",
      scale: "risk",
      reverse: true
    }, {
      text: "Я довольно часто откладываю на завтра то, что трудно осуществимо, или то, в чем я не уверен.",
      scale: "control",
      reverse: true
    }, {
      text: "Мне кажется, жизнь проходит мимо меня.",
      scale: "involvement",
      reverse: true
    }, {
      text: "Мои мечты редко сбываются.",
      scale: "risk",
      reverse: true
    }, {
      text: "Неожиданности дарят мне интерес к жизни.",
      scale: "risk",
      reverse: false
    }, {
      text: "Порой мне кажется, что все мои усилия тщетны.",
      scale: "control",
      reverse: true
    }, {
      text: "Порой я мечтаю о спокойной размеренной жизни.",
      scale: "risk",
      reverse: true
    }, {
      text: "Мне не хватает упорства закончить начатое.",
      scale: "involvement",
      reverse: true
    }, {
      text: "Бывает, жизнь кажется мне скучной и бесцветной.",
      scale: "involvement",
      reverse: true
    }, {
      text: "У меня нет возможности влиять на неожиданные проблемы.",
      scale: "control",
      reverse: true
    }, {
      text: "Окружающие меня недооценивают.",
      scale: "involvement",
      reverse: true
    }, {
      text: "Как правило, я работаю с удовольствием.",
      scale: "involvement",
      reverse: false
    }, {
      text: "Иногда я чувствую себя лишним даже в кругу друзей.",
      scale: "involvement",
      reverse: true
    }, {
      text: "Бывает, на меня наваливается столько проблем, что просто руки опускаются.",
      scale: "control",
      reverse: true
    }, {
      text: "Друзья уважают меня за упорство и непреклонность.",
      scale: "control",
      reverse: false
    }, {
      text: "Я охотно берусь воплощать новые идеи.",
      scale: "risk",
      reverse: false
    }];
    // Варианты ответов
    const options = [{
      text: "Нет",
      value: 0
    }, {
      text: "Скорее нет, чем да",
      value: 1
    }, {
      text: "Скорее да, чем нет",
      value: 2
    }, {
      text: "Да",
      value: 3
    }];
    // Диапазоны для интерпретации результатов
    const scoreRanges = {
      involvement: {
        low: 29,
        medium: 46,
        high: 54
      },
      control: {
        low: 20,
        medium: 38,
        high: 51
      },
      risk: {
        low: 8,
        medium: 18,
        high: 30
      },
      total: {
        low: 61,
        medium: 99,
        high: 135
      }
    };
    // Тексты для разных уровней
    const levelTexts = {
      involvement: {
        high: `<b>Вы набрали {score} баллов по шкале «Вовлеченность», это высокий уровень развития этого убеждения.</b>\n
Вы воспринимаете происходящее как ценное и заслуживающее участия. Вам свойственна активная включённость в работу, отношения, проекты. Вы склонны видеть в происходящем значимость, что усиливает мотивацию, делает вас устойчивым в сложных условиях и позволяет сохранять внутреннюю целостность.\n

`,
        medium: `<b>Вы набрали {score} баллов по шкале «Вовлеченность», это средний уровень развития этого убеждения.</b>\n
Вы способны вовлекаться в происходящее, когда видите в нем личную значимость, но это происходит не всегда стабильно. Иногда интерес и ощущение включённости угасают при рутине, давлении или отсутствии обратной связи.\n
<b>Профессиональные риски:</b>\n- Снижение мотивации при длительных или однотипных задачах.\n- Поверхностное участие в командных процессах.\n- Ограниченное желание проявлять инициативу.\n
<b>Личные риски:</b>\n- Некоторая потеря интереса к важным для вас делам.\n- Чувство «отчуждения» от собственных действий.\n- Снижение ощущения удовлетворенности жизнью.\n
<b>Коммуникативные риски:</b>\n- Ощущение некоторой отчужденности между вами и другими людьми.\n- Трудности в поиске смысла и целей совместной деятельности.\n- Формальная коммуникация без эмоционального включения.

`,
        low: `<b>Вы набрали {score} баллов по шкале «Вовлеченность» — это низкий уровень развития этого убеждения.</b>\n
Вы можете испытывать отчуждение от происходящего, воспринимать повседневные задачи как лишённые личной значимости. Участие в событиях может ощущаться как вынужденное, а не добровольное. Это ослабляет устойчивость, мотивацию и делает стресс разрушительным.\n
<b>Профессиональные риски:</b>\n- Формальное выполнение работы без активной включенности в деятельность.\n- Отсутствие стремления к развитию.\n- Выгорание даже при небольшой нагрузке.\n
<b>Личные риски:</b>\n- Ощущение бессмысленности деятельности.\n- Эмоциональная усталость и апатия.\n- Снижение самооценки и ощущение «я не нужен».\n
<b>Коммуникативные риски:</b>\n- Изоляция в коллективе.\n- Поверхностные связи.\n- Нежелание участвовать в общих инициативах.

`
      },
      control: {
        high: `<b>Вы набрали {score} баллов по шкале «Контроль» — это высокий уровень развития этого убеждения.</b>\n
Вы воспринимаете себя как активного участника событий и склонны брать ответственность за происходящее. Вы не перекладываете решения на других, умеете управлять собственным поведением и влияете на окружение. Это создаёт внутреннюю устойчивость в условиях неопределённости и делает вас надёжным членом команды или лидером.\n

`,
        medium: `<b>Вы набрали {score} баллов по шкале «Контроль» — это средний уровень развития этого убеждения.</b>\n
Вы частично ощущаете возможность влиять на происходящее, но в условиях давления или неопределенности это чувство может ослабевать. Иногда вы берете инициативу, но не всегда доводите до конца, или откладываете решения, если не уверены в результате. Это может создавать ощущение нестабильности и снижение активности в преодолении трудностей в стрессовых ситуациях.\n
<b>Профессиональные риски:</b>\n- Трудности с принятием решений в условиях неопределенности.\n- Ожидание указаний или внешнего одобрения.\n- Снижение инициативности при высокой нагрузке.\n
<b>Личные риски:</b>\n- Колебания самооценки.\n- Ощущение зависимости от внешних обстоятельств.\n- Повышенная уязвимость к стрессу.\n
<b>Коммуникативные риски:</b>\n- Передача ответственности другим.\n- Потенциальные конфликты из-за избегания ответственности.\n- Снижение доверия к вам во время совместной работы.

`,
        low: `<b>Вы набрали {score} баллов по шкале «Контроль» — это низкий уровень развития этого убеждения.</b>\n
Вы можете воспринимать происходящее как нечто, что вами не управляется. Склонность приписывать успех или неудачу внешним силам ограничивает вашу активность, снижает мотивацию и усиливает стресс. Такое восприятие формирует ощущение беспомощности и мешает строить устойчивую позицию в жизни и работе.\n
<b>Профессиональные риски:</b>\n- Пассивное поведение в сложных ситуациях.\n- Избегание ответственности.\n- Снижение результативности под давлением.\n
<b>Личные риски:</b>\n- Ощущение своей беспомощности, невозможности повлиять на события.\n- Повышенная тревожность.\n- Потеря ощущения «я хозяин / хозяйка своей судьбы».\n
<b>Коммуникативные риски:</b>\n- Зависимость от мнений и решений других.\n- Повышенная конфликтность в условиях неопределенности.\n- Недоверие в отношениях из-за неустойчивости позиции.

`
      },
      risk: {
        high: `<b>Вы набрали {score} баллов по шкале «Принятие риска» — это высокий уровень развития этого убеждения.</b>\n
Вы открыты к изменениям и готовы встречать неопределенность как естественную часть жизни. Вы учитесь на своих неудачах и используете сложности для своего роста и развития. Новые задачи и нестандартные ситуации не пугают вас, а включают в работу и поиск решений. Такая позиция позволяет адаптироваться, проявлять гибкость, находить инновационные подходы решения сложных задач и сохранять психологическую устойчивость в условиях нестабильности.\n

`,
        medium: `<b>Вы набрали {score} баллов по шкале «Принятие риска» — это средний уровень развития этого убеждения.</b>\n
Вы способны адаптироваться к переменам, если они понятны и управляемы, но резкие или неоднозначные изменения могут вызывать напряжение. В ситуациях нестабильности вы склонны к осторожности, предпочитая стабильные схемы поведения. Это не мешает вам развиваться, но может ограничивать скорость реагирования и инициативность в быстро меняющейся среде.\n
<b>Профессиональные риски:</b>\n- Задержки в принятии решений в условиях изменений.\n- Снижение эффективности в нестабильной обстановке.\n- Затрудненный выход за рамки привычных действий.\n
<b>Личные риски:</b>\n- Повышенная тревожность при непредсказуемых обстоятельствах.\n- Чувство внутреннего напряжения при необходимости быстро адаптироваться.\n- Переживание неуверенности и сомнений при смене условий.\n
<b>Коммуникативные риски:</b>\n- Избегание обсуждений, связанных с переменами.\n- Напряженные отношения с более гибкими и инициативными людьми.\n- Сопротивление новым подходам и способам действий.

`,
        low: `<b>Вы набрали {score} баллов по шкале «Принятие риска» — это низкий уровень развития этого убеждения.</b>\n
Вы склонны воспринимать перемены как угрозу, а нестабильность — как источник тревоги. Это может блокировать инициативу, затруднять обучение и вызывать стремление сохранить статус-кво даже тогда, когда требуется адаптация. В долгосрочной перспективе такое отношение снижает способность справляться со стрессом и может вести к выгоранию.\n
<b>Профессиональные риски:</b>\n- Сопротивление инновациям и изменениям.\n- Потеря эффективности в условиях нестабильности.\n- Ограниченность в карьерном росте в динамичных сферах.\n
<b>Личные риски:</b>\n- Высокий уровень тревожности из-за ощущения нестабильности.\n- Ощущение уязвимости и неуверенности.\n- Снижение самооценки при неудачных попытках адаптации.\n
<b>Коммуникативные риски:</b>\n- Отстраненность от совместных действий с другими в ситуации изменений.\n- Сопротивление при внедрении новых подходов к деятельности.\n- Нежелание принимать участие в совместных инновационных инициативах.

`
      },
      total: {
        high: `<b>Вы набрали {score} баллов по шкале «Общая жизнестойкость» — это высокий уровень развития этого качества.</b>\n
Вы обладаете устойчивым личностным ресурсом, позволяющим справляться с трудностями, адаптироваться к изменениям и сохранять внутреннюю опору в условиях стресса. У вас сформированы и поддерживаются все три ключевых убеждения: вы включены в происходящее, ощущаете влияние на свою жизнь и воспринимаете трудности как источник роста. Это делает вас надежным, устойчивым и поддерживающим других человеком.\n

`,
        medium: `<b>Вы набрали {score} баллов по шкале «Общая жизнестойкость» — это средний уровень развития этого качества.</b>\n
Вы в целом справляетесь с трудностями и способны сохранять устойчивость, но ваши убеждения о себе и мире могут быть нестабильными. Возможно, в одних ситуациях вы чувствуете влияние и смысл, а в других — теряете уверенность или уходите в защиту. Такой уровень может быть достаточен при умеренной нагрузке, но требует укрепления, чтобы сохранять эффективность в сложных и нестабильных условиях.\n
<b>Профессиональные риски:</b>\n- Потеря мотивации и устойчивости в условиях продолжительного давления.\n- Эпизодическая неуверенность в себе и в своей позиции.\n- Колебания в уровне инициативы и ответственности.\n
<b>Личные риски:</b>\n- Эмоциональное истощение при частых внешних изменениях.\n- Повышенная тревожность при неопределенности.\n- Затрудненное восстановление после неудач.\n
<b>Коммуникативные риски:</b>\n- Неустойчивость в роли — от поддержки к дистанции.\n- Сложности в передаче уверенности другим.\n- Недоверие при конфликте или изменении командной динамики.

`,
        low: `<b>Вы набрали {score} баллов по шкале «Общая жизнестойкость» — это низкий уровень развития этого качества.</b>\n
Возможно, вы часто ощущаете бессилие, нестабильность, трудности воспринимаются как угрозы, а не как задачи, с которыми можно справиться. Убеждения, поддерживающие устойчивость, пока слабо выражены, и это делает реакции на стресс тяжелыми, а адаптацию — замедленной или фрагментарной.\n
<b>Профессиональные риски:</b>\n- Эмоциональное и профессиональное выгорание.\n- Отказ от ответственности, уход в формальные роли.\n- Снижение гибкости и способности к развитию.\n
<b>Личные риски:</b>\n- Хроническая тревожность, чувство беспомощности.\n- Потеря уверенности в себе и в будущем.\n- Повышенная уязвимость к стрессу и неудачам.\n
<b>Коммуникативные риски:</b>\n- Закрытость от других, изоляция.\n- Снижение способности к диалогу и командному взаимодействию.\n- Ощущение недоверия или зависимости в отношениях.

`
      }
    };
    // Рекомендации для каждого уровня
    const recommendations = {
      involvement: {
        high: `Рекомендации по поддержанию:\n1. Сохраняйте связь с деятельностью, которая вызывает интерес, соответствует вашим ценностям — это естественный источник вовлеченности.\n2. Регулярно оценивайте: в чём для вас лично смысл или важность текущих ситуаций. Сознательно наполняйте их смыслом.\n3. Делитесь своим интересом с другими — это усиливает и улучшает взаимоотношения с окружающими людьми, заряжает их вашим энтузиазмом и делает вас ценным в их глазах.\n4. Старайтесь вовремя восстанавливать свои ресурсы, чтобы избежать эмоционального истощения на фоне высокой вовлеченности.\n5. Включайте рефлексию: фиксируйте, где и когда вы ощущали подлинную включенность в деятельность и что этому способствовало.`,
        medium: `Рекомендации по развитию:\n1. Используйте ментальные стратегии совладания: разбивайте сложные задачи на управляемые части — это повышает ощущение вовлеченности через достижение значимого для вас результата.\n2. Создайте практику обратной связи от семьи, друзей и коллег: попросите их сообщать, когда то, что вы делаете, для них значимо.\n3. Задайте себе вопрос: «Что в этом процессе для меня лично важно?» — смысловая проработка повышает включенность в деятельность.\n4. Включайтесь в помощь другим: предоставление поддержки — важный компонент благополучия, формирующий ощущение значимости себя и происходящего.5. Фиксируйте моменты интереса и энергии и старайтесь переносить их в другие сферы.`,
        low: `Рекомендации по развитию:\n1. Начните с малого: в течение дня фиксируйте хотя бы 1–2 момента, когда вы почувствовали интерес или удовлетворение от задачи.\n2. Найдите людей, которые могут разделить с вами задачи и показать, как в них можно увидеть ценность.\n3. Попросите честную обратную связь: в каких ситуациях ваше участие помогло другим – это поддержит формирование убеждения «я важен и нужен».\n4. Пробуйте влиять на структуру дня, менять последовательность задач, внедрять хотя бы небольшой элемент выбора.\n5. Используйте восстановление: эмоциональное истощение при низкой вовлеченности может усиливать отчуждение. Регулярная забота о себе возвращает ощущение включенности в жизнь.`
      },
      control: {
        high: `Рекомендации по поддержанию:\n1. Поддерживайте регулярную рефлексию: отслеживайте, где вы влияли, принимали решения и несли за них последствия – это развивает жизнестойкие убеждения.\n2. Планируйте свою деятельность: умение действовать по шагам усиливает ощущение контроля.\n3. Помогайте другим укреплять их авторскую позицию – ощущение того, что у них есть возможность позитивно влиять на происходящее. Это усиливает и ваше собственное ощущение возможности влиять на события.\n4. Обеспечивайте себе пространство для восстановления: активное управление собой требует ресурса, и отдых – не слабость, а стратегическая поддержка себя.`,
        medium: `Рекомендации по развитию:\n1. Внедряйте практику «малых решений»: осознанно фиксируйте ситуации, где вы сделали выбор и повлияли на результат.\n2. Анализ ситуации и планирование решительных действий по улучшению ситуации помогут увидеть зоны влияния там, где они были скрыты.\n3. Обращайтесь за поддержкой – обсуждение сложных ситуаций с тем, кому вы доверяете, помогает повысить ощущение контроля над ситуацией.\n4. Развивайте саморегуляцию: эмоциональная стабильность усиливает способность брать ответственность в нестабильных условиях.`,
        low: `Рекомендации по развитию:\n1. Начните фиксировать и называть зоны, где вы действительно принимаете решения, даже небольшие.\n2. Осваивайте стратегию «малых дел»: что я могу изменить прямо сейчас?\n3. Запрашивайте поддержку от людей, которые уважают вашу самостоятельность – это формирует уверенность без зависимости.\n4. Практикуйте методы самовосстановления как способ обрести внутренний опору: даже минимальная забота о себе (например, небольшая физическая тренировка, дыхательная практика, массаж) возвращает ощущение влияния на свою жизнь.`
      },
      risk: {
        high: `Рекомендации по поддержанию:\n1. Используйте вызовы как тренировку ресурса: фиксируйте, как в трудной ситуации вы нашли возможности для роста — это укрепляет жизнестойкие убеждения.\n2. При каждом изменении задавайте себе вопрос «что я могу с этим сделать?», так вы сохраняете активную позицию.\n3. Делитесь опытом преодоления с другими — через поддержку вы не только помогаете им, но и укрепляете свою уверенность.\n4. Не забывайте про восстановление после напряженных периодов: даже жизнестойкий человек нуждается в балансе между активностью и отдыхом.`,
        medium: `Рекомендации по развитию:\n1. Используйте технику «малых рисков»: регулярно выходите за рамки рутины.\n2. Переосмысливайте стрессовые ситуации: вместо восприятия ситуации «это угроза» ищите, какую пользу можно извлечь для себя и своего развития.\n3. Пробуйте включаться в помощь другим, кто переживает изменения, через поддержку укрепляется ваша собственная психологическая устойчивость.\n4. Создайте ритуалы восстановления после каждого шага в новое — адаптация требует ресурса, и его важно своевременно возвращать.`,
        low: `Рекомендации по развитию:\n1. Начинайте с безопасных изменений: небольшие отклонения от привычных схем дают опыт успеха и укрепляют жизнестойкие убеждения.\n2. Применяйте копинг-стратегии (стратегии совладания со сложными ситуациями) с опорой на текущие ресурсы: задайте вопрос «что в этой ситуации все еще зависит от меня?»\n3. Обратитесь за поддержкой к тем, кто спокойно адаптируется к переменам — их примеры и участие могут усилить вашу устойчивость.\n4. Работайте над снижением физиологической тревожности: практики восстановления создают ощущение защищённости, необходимое для шага в новое.`
      }
    };
    // Переменные состояния
    let currentQuestion = 0;
    let answers = [];
    let scores = {
      involvement: 0,
      control: 0,
      risk: 0,
      total: 0
    };
    // DOM элементы
    const introPage = document.getElementById('intro-page');
    const testPage = document.getElementById('test-page');
    const loadingPage = document.getElementById('loading-page');
    const resultsPage = document.getElementById('results-page');
    const currentQuestionEl = document.getElementById('current-question');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const startTestBtn = document.getElementById('start-test');
    const getReportBtn = document.getElementById('get-report');
    const noThanksBtn = document.getElementById('no-thanks');
    const formModal = document.getElementById('form-modal');
    const offerModal = document.getElementById('offer-modal');
    const closeBtns = document.querySelectorAll('.close-btn');
    const reportForm = document.getElementById('report-form');
    const interestedBtn = document.getElementById('interested');
    const noThanksBtn2 = document.getElementById('no-thanks-2');
    // Инициализация теста
    function initTest() {
      answers = [];
      currentQuestion = 0;
      scores = {
        involvement: 0,
        control: 0,
        risk: 0,
        total: 0
      };
      showQuestion();
    }
    // Показать текущий вопрос
    function showQuestion() {
      if (currentQuestion >= questions.length) {
        finishTest();
        return;
      }
      currentQuestionEl.textContent = currentQuestion + 1;
      questionText.textContent = questions[currentQuestion].text;
      optionsContainer.innerHTML = '';
      options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'answer';
        input.id = `option-${index}`;
        input.value = option.value;
        const label = document.createElement('label');
        label.htmlFor = `option-${index}`;
        label.textContent = option.text;
        optionElement.appendChild(input);
        optionElement.appendChild(label);
        optionsContainer.appendChild(optionElement);
        // Обработчик выбора ответа
        input.addEventListener('change', () => {
          setTimeout(() => {
            answers.push({
              question: currentQuestion,
              answer: parseInt(input.value),
              scale: questions[currentQuestion].scale,
              reverse: questions[currentQuestion].reverse
            });
            currentQuestion++;
            showQuestion();
          }, 300);
        });
      });
    }
    // Завершение теста
    function finishTest() {
      testPage.style.display = 'none';
      loadingPage.style.display = 'block';
      // Рассчет результатов
      calculateResults();
      // Имитация загрузки
      setTimeout(() => {
        loadingPage.style.display = 'none';
        resultsPage.style.display = 'block';
        showResults();
      }, 3000);
    }
    // Рассчет результатов
    function calculateResults() {
      // Сброс счетчиков
      scores.involvement = 0;
      scores.control = 0;
      scores.risk = 0;
      // Подсчет баллов по шкалам с учетом прямых/обратных вопросов
      answers.forEach(answer => {
        let points = answer.reverse ? (3 - answer.answer) : answer.answer;
        scores[answer.scale] += points;
      });
      // Общий балл
      scores.total = scores.involvement + scores.control + scores.risk;
    }
    // Определение уровня по баллам
    function getLevel(score, scale) {
      if (score <= scoreRanges[scale].low) return "low";
      if (score <= scoreRanges[scale].medium) return "medium";
      return "high";
    }
    // Получение текста уровня
    function getLevelText(level) {
      const levels = {
        low: "Низкий",
        medium: "Средний",
        high: "Высокий"
      };
      return levels[level] || "";
    }
    // Получение цвета для уровня
    function getLevelColor(level) {
      const colors = {
        low: "#f2b9b8",
        medium: "#f5d458",
        high: "#acd678"
      };
      return colors[level] || "#86da3a";
    }
    // Показать результаты
    function showResults() {
      // Получаем уровни для каждой шкалы
      const involvementLevel = getLevel(scores.involvement, 'involvement');
      const controlLevel = getLevel(scores.control, 'control');
      const riskLevel = getLevel(scores.risk, 'risk');
      const totalLevel = getLevel(scores.total, 'total');
      // Установка значений
      document.getElementById('involvement-value').textContent = scores.involvement;
      document.getElementById('control-value').textContent = scores.control;
      document.getElementById('risk-value').textContent = scores.risk;
      document.getElementById('total-value').textContent = scores.total;
      // Установка уровней
      document.getElementById('involvement-level').textContent = getLevelText(involvementLevel);
      document.getElementById('control-level').textContent = getLevelText(controlLevel);
      document.getElementById('risk-level').textContent = getLevelText(riskLevel);
      document.getElementById('total-level').textContent = getLevelText(totalLevel);
      // Анимация прогресс-баров с цветами
      setTimeout(() => {
        const involvementBar = document.getElementById('involvement-bar');
        involvementBar.style.width = `${(scores.involvement / scoreRanges.involvement.high) * 100}%`;
        involvementBar.style.backgroundColor = getLevelColor(involvementLevel);
        const controlBar = document.getElementById('control-bar');
        controlBar.style.width = `${(scores.control / scoreRanges.control.high) * 100}%`;
        controlBar.style.backgroundColor = getLevelColor(controlLevel);
        const riskBar = document.getElementById('risk-bar');
        riskBar.style.width = `${(scores.risk / scoreRanges.risk.high) * 100}%`;
        riskBar.style.backgroundColor = getLevelColor(riskLevel);
        const totalBar = document.getElementById('total-bar');
        totalBar.style.width = `${(scores.total / scoreRanges.total.high) * 100}%`;
        totalBar.style.backgroundColor = getLevelColor(totalLevel);
      }, 100);
    }
    // Новая функция для генерации PDF
    async function generateAndDownloadPDF(userData) {
      const {
        jsPDF
      } = window.jspdf;
      const doc = new jsPDF();
      try {
        // Регистрация шрифта (асинхронная)
        await registerFont(doc);
        // Настройки документа
        doc.setFontSize(12);
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let yPos = 30; // Начальная позиция Y
        // Разделительная линия
        doc.setDrawColor(235, 247, 253);
        doc.setLineWidth(80);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 20;
        // Добавление логотипа
        const logoUrl = 'https://i.postimg.cc/QMrq2RTL/logo.png';
        try {
          await addImageToPDF(doc, logoUrl, 95, 10, 20, 21.6);
        } catch (e) {
          console.error('Ошибка загрузки логотипа:', e);
        }
        // Заголовок отчета
        doc.setFont("NotoSans", "bold");
        doc.setFontSize(18);
        doc.setTextColor(39, 69, 87);
        doc.text('Результаты теста жизнестойкости', pageWidth / 2, yPos, {
          align: 'center'
        });
        yPos += 10;
        // Данные пользователя
        doc.setFont("NotoSans", "bold");
        doc.setFontSize(14);
        doc.text(`${userData.firstName} ${userData.lastName}`, pageWidth / 2, yPos, {
          align: 'center'
        });
        yPos += 25;
        // Краткое описание
        doc.setFont("NotoSans", "italic");
        doc.setFontSize(12);
        doc.setTextColor(76, 104, 119);
        const description = 'Жизнестойкость — это система убеждений, которая помогает человеку справляться\nсо стрессом и трудностями.';
        doc.text(description, margin, yPos);
        yPos += 15;
        doc.setFont("NotoSans", "normal");
        // Таблица результатов
        const tableData = [
          ['Шкала', 'Баллы', 'Уровень', 'Диапазон'],
          ['Вовлеченность', scores.involvement, getLevelText(getLevel(scores.involvement, 'involvement')), '0-54'],
          ['Контроль', scores.control, getLevelText(getLevel(scores.control, 'control')), '0-51'],
          ['Принятие риска', scores.risk, getLevelText(getLevel(scores.risk, 'risk')), '0-30'],
          ['Общая жизнестойкость', scores.total, getLevelText(getLevel(scores.total, 'total')), '0-135']
        ];
        doc.autoTable({
          startY: yPos,
          head: [tableData[0]],
          body: tableData.slice(1),
          margin: {
            left: margin,
            right: margin
          },
          styles: {
            font: 'NotoSans',
            fontSize: 10,
            textColor: [39, 69, 87],
            cellPadding: 4
          },
          headStyles: {
            fillColor: [242, 242, 242],
            textColor: [39, 69, 87],
            font: 'NotoSans',
            fontStyle: 'bold'
          }
        });
        // Добавление интерпретаций и рекомендаций
        yPos = doc.lastAutoTable.finalY + 15;
        // Функция для добавления текста с проверкой на новую страницу
        function addTextWithPageBreak(text, y, isBold = false) {
          const originalFont = doc.getFont();
          const originalSize = doc.getFontSize();
          const originalColor = doc.getTextColor();
          const textHeight = doc.getTextDimensions(text).h;
          if (y + textHeight > doc.internal.pageSize.getHeight() - 20) {
            addFooter(doc); // Добавляем футер перед созданием новой страницы
            doc.addPage();
            y = 20;
          }
          if (isBold) {
            doc.setFont('NotoSans', 'bold');
            doc.text(text, margin, y);
            doc.setFont('NotoSans', 'normal');
          } else {
            doc.text(text, margin, y);
          }
          // Восстановление стилей
          doc.setFont(originalFont.fontName, originalFont.fontStyle);
          doc.setFontSize(originalSize);
          doc.setTextColor(originalColor);
          return y + textHeight + 5;
        }
        // Добавление интерпретаций и рекомендаций
        const scales = [{
          name: 'Вовлеченность',
          key: 'involvement'
        }, {
          name: 'Контроль',
          key: 'control'
        }, {
          name: 'Принятие риска',
          key: 'risk'
        }];
        for (const scale of scales) {
          const level = getLevel(scores[scale.key], scale.key);
          const text = levelTexts[scale.key][level].replace('{score}', scores[scale.key]);
          const recText = recommendations[scale.key][level];
          // Проверяем место перед добавлением новой шкалы
          // Ожидаем, что для шкалы нужно минимум 50 единиц места
          yPos = checkPageSpace(doc, yPos, 50);
          // Заголовок шкалы
          yPos = addFormattedText(doc, scale.name, yPos, {
            fontSize: 15,
            isBold: true,
            textColor: [39, 69, 87]
          });
          // Текст интерпретации
          yPos = addFormattedText(doc, text, yPos, {
            fontSize: 12
          });
          // Проверяем место перед рекомендациями
          yPos = checkPageSpace(doc, yPos, 30);
          // Заголовок рекомендаций
          yPos = addFormattedText(doc, 'Рекомендации:', yPos, {
            fontSize: 13,
            isBold: true,
            textColor: [134, 218, 58]
          });
          // Текст рекомендаций
          yPos = addFormattedText(doc, recText, yPos, {
            fontSize: 12
          });
          yPos += 10;
        }
        // Предложение обучения + Линия разделительная
        doc.setDrawColor(39, 69, 87);
        doc.setLineWidth(0.3);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 20;
        doc.setFont("NotoSans", "bold");
        doc.setFontSize(15);
        doc.setTextColor(39, 69, 87);
        yPos = addTextWithPageBreak('Предложение пройти обучение:', yPos, true);
        doc.setFont("NotoSans", "normal");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        yPos = addTextWithPageBreak('Для дальнейшего развития вашей жизнестойкости мы предлагаем:', yPos);
        const bullets = [
          'Укрепить убеждения о ценности происходящего',
          'Развить способность влиять на события',
          'Научиться воспринимать изменения как возможности',
          'Сформировать устойчивость к стрессу'
        ];
        for (const bullet of bullets) {
          yPos = addTextWithPageBreak('• ' + bullet, yPos);
        }
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        yPos = addTextWithPageBreak('\nПодробнее о курсе вы можете узнать на нашем сайте: https://hardipeople.com', yPos);
        // Футер с контактами
        //doc.setFont("NotoSans", "normal");
        //  doc.setFontSize(10);
        // doc.setTextColor(100, 100, 100);
        // doc.text('Сайт: hardipeople.com | Подробнее о курсах: hardipeople.com/course', 
        //  pageWidth / 2, doc.internal.pageSize.getHeight() - 10, 
        // { align: 'center' });
        addFooter(doc);
        // Сохранение PDF
        doc.save(`Результаты теста жизнестойкости - ${userData.firstName} ${userData.lastName}.pdf`);

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
        const pdfBlob = pdf.output('blob');



          
       //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////   

        
        // Отправка данных на сервер
        await sendDataToServer(userData, pdfBlob);
      } catch (error) {
        console.error('Ошибка при генерации PDF:', error);
        //alert('Произошла ошибка при создании отчета. Пожалуйста, попробуйте еще раз.');
      }
    }
    /////////////////////////////////////////////////////////////////////////////////////////////////
    // Вспомогательная функция для добавления изображения
    function addImageToPDF(doc, url, x, y, width, height) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          doc.addImage(img, 'JPEG', x, y, width, height);
          resolve();
        };
        img.onerror = reject;
        img.src = url;
      });
    }
    // Вспомогательная функция для добавления разделов
    function addSection(doc, title, levelTexts, recommendations, x, y) {
      // Сопоставление русских названий с английскими ключами
      const scaleMap = {
        'вовлеченность': 'involvement',
        'контроль': 'control',
        'принятие риска': 'risk',
        'общая жизнестойкость': 'total'
      };
      const scaleKey = scaleMap[title.toLowerCase()];
      if (!scaleKey) {
        console.error('Неизвестная шкала:', title);
        return;
      }
      const level = getLevel(scores[scaleKey], scaleKey);
      const text = levelTexts[level].replace('{score}', scores[scaleKey]);
      doc.setFont("NotoSans", "bold");
      doc.setFontSize(15);
      doc.setTextColor(39, 69, 87);
      doc.text(title, x, y);
      y += 7;
      doc.setFont("NotoSans", "normal");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const splitText = doc.splitTextToSize(text, doc.internal.pageSize.getWidth() - 2 * x);
      doc.text(splitText, x, y);
      y += splitText.length * 7 + 5;
      // Рекомендации
      doc.setFont("NotoSans", "bold");
      doc.setFontSize(13);
      doc.setTextColor(134, 218, 58);
      doc.text('Рекомендации:', x, y);
      y += 7;
      doc.setFont("NotoSans", "normal");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const splitRec = doc.splitTextToSize(recommendations[level], doc.internal.pageSize.getWidth() - 2 * x);
      doc.text(splitRec, x, y);
    }
    // Обновленная функция отправки данных
    async function sendDataToServer(userData, pdfBlob) {  
      try {
     // Создаем FormData для отправки
    const formData = new FormData();
    formData.append('firstName', userData.firstName);
    formData.append('lastName', userData.lastName);
    formData.append('email', userData.email);
    formData.append('phone', userData.phone || '');
    formData.append('testResults', JSON.stringify(scores));
    formData.append('pdfFile', pdfBlob, 'test_results.pdf');
          
          
 const response = await fetch('http://212.67.11.10:3000/api/submit', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    console.log('Данные успешно отправлены на сервер:', result);
    return result;
  } catch (error) {
    console.error('Ошибка при отправке данных на сервер:', error);
    throw error;
  }
}
    // Открыть модальное окно
    function openModal(modal) {
      modal.style.display = 'flex';
    }
    // Закрыть модальное окно
    function closeModal(modal) {
      modal.style.display = 'none';
    }
    // Сброс теста
    function resetTest() {
      resultsPage.style.display = 'none';
      introPage.style.display = 'block';
    }
    // Обработчики событий
    startTestBtn.addEventListener('click', () => {
      introPage.style.display = 'none';
      testPage.style.display = 'block';
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'instant'
        });
      }, 50);
      initTest();
    });
    getReportBtn.addEventListener('click', () => {
      openModal(formModal);
    });
    noThanksBtn.addEventListener('click', resetTest);
    closeBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const modal = this.closest('.modal');
        closeModal(modal);
      });
    });
    // Обновленный обработчик формы
    reportForm.addEventListener('submit', async(e) => {
      e.preventDefault();
      const userData = {
        firstName: document.getElementById('first-name').value,
        lastName: document.getElementById('last-name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value || ''
      };
      closeModal(formModal);
      try {
        await generateAndDownloadPDF(userData);
        openModal(offerModal);
      } catch (error) {
        console.error('Error:', error);
      }
    });
    interestedBtn.addEventListener('click', () => {
      closeModal(offerModal);
      resetTest();
      window.location.href = 'https://hardipeople.com';
    });
    noThanksBtn2.addEventListener('click', () => {
      closeModal(offerModal);
      resetTest();
    });
    // Закрытие модальных окон при клике вне их
    window.addEventListener('click', (e) => {
      if (e.target === formModal) {
        closeModal(formModal);
      }
      if (e.target === offerModal) {
        closeModal(offerModal);
      }
    });
