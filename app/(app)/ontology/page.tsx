import {prisma} from "@/lib/prisma";

export default async function OntologyPage() {
  // Fetch all ontology data
  const virtues = await prisma.virtue.findMany({
    include: {
      subVirtues: {
        include: {
          sentences: true,
        },
      },
    },
  });

  const lacunae = await prisma.lacuna.findMany({
    include: {
      lacunaSubVirtues: {
        include: {
          subVirtue: true,
        },
        orderBy: {
          priority: "asc",
        },
      },
    },
  });

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Ontology</h2>

      <div className="space-y-12">
        {/* Virtues Section */}
        <section>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Virtues & SubVirtues</h3>

          <div className="space-y-8">
            {virtues.map((virtue) => (
              <div key={virtue.id} className="border-l-4 border-blue-500 pl-6">
                <h4 className="text-lg font-bold text-gray-900">
                  {virtue.nameEn}
                  <span className="text-sm text-gray-500 ml-2">({virtue.nameMr})</span>
                </h4>

                <div className="mt-4 space-y-6">
                  {virtue.subVirtues.map((subVirtue) => (
                    <div
                      key={subVirtue.id}
                      className="bg-white rounded-lg border border-gray-200 p-4"
                    >
                      <h5 className="font-semibold text-gray-800">
                        {subVirtue.nameEn}
                        <span className="text-sm text-gray-500 ml-2">
                          ({subVirtue.nameMr})
                        </span>
                      </h5>

                      {subVirtue.sentences.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                            Sentences
                          </p>
                          <ul className="space-y-2">
                            {subVirtue.sentences.map((sentence) => (
                              <li
                                key={sentence.id}
                                className="text-sm text-gray-700 bg-gray-50 p-2 rounded"
                              >
                                <p className="font-medium">{sentence.textEn}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {sentence.textMr}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Lacunae Section */}
        <section>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Lacunae (Weaknesses)</h3>

          <div className="space-y-6">
            {lacunae.map((lacuna) => (
              <div
                key={lacuna.id}
                className="border-l-4 border-red-500 pl-6 bg-white rounded-lg border border-gray-200 p-4"
              >
                <h4 className="text-lg font-bold text-gray-900">
                  {lacuna.nameEn}
                  <span className="text-sm text-gray-500 ml-2">({lacuna.nameMr})</span>
                </h4>

                {lacuna.lacunaSubVirtues.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
                      Related SubVirtues to Cultivate (Priority Order)
                    </p>
                    <ul className="space-y-1">
                      {lacuna.lacunaSubVirtues.map((link, index) => (
                        <li
                          key={link.id}
                          className="text-sm text-gray-700 flex items-start"
                        >
                          <span className="mr-3 text-gray-500 font-medium">
                            {index + 1}.
                          </span>
                          <span>
                            {link.subVirtue.nameEn}
                            <span className="text-xs text-gray-500 ml-2">
                              ({link.subVirtue.nameMr})
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Summary Stats */}
      <section className="mt-12 bg-gray-100 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Ontology Summary</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600">{virtues.length}</div>
            <div className="text-sm text-gray-600">Virtues</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">
              {virtues.reduce((acc, v) => acc + v.subVirtues.length, 0)}
            </div>
            <div className="text-sm text-gray-600">SubVirtues</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">
              {virtues.reduce(
                (acc, v) =>
                  acc + v.subVirtues.reduce((sacc, sv) => sacc + sv.sentences.length, 0),
                0
              )}
            </div>
            <div className="text-sm text-gray-600">Sentences</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-red-600">{lacunae.length}</div>
            <div className="text-sm text-gray-600">Lacunae</div>
          </div>
        </div>
      </section>
    </div>
  );
}
